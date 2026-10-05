import { PrismaClient } from '@prisma/client';
import { MatchScoreBreakdown, MatchStatus } from '@dealconnect/shared-types';
import { requireDealerId } from '../../common/tenant-context.js';

export interface VehicleMatchInput {
  id: string;
  dealerId: string;
  make: string;
  model: string;
  variant?: string | null;
  year: number;
  price: number;
  fuel?: string | null;
  transmission?: string | null;
  kilometers?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
  status: string;
}

export interface RequirementMatchInput {
  id: string;
  dealerId: string;
  customerId: string;
  status: string;
  preferences?: {
    make?: string | null;
    model?: string | null;
    variant?: string | null;
    minYear?: number | null;
    maxYear?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    fuel?: string | null;
    transmission?: string | null;
    maxKm?: number | null;
    locationLat?: number | null;
    locationLng?: number | null;
    radiusKm?: number | null;
  } | null;
}

export class MatchingService {
  public static readonly NOTIFICATION_THRESHOLD = 75;

  constructor(private prisma: PrismaClient) {}

  /**
   * Deterministic 100-Point Scoring Algorithm according to 07_MATCHING_RULES.md
   */
  calculateScore(req: RequirementMatchInput, vehicle: VehicleMatchInput): { score: number; breakdown: MatchScoreBreakdown; isEligible: boolean } {
    const pref = req.preferences;

    // HARD FILTERS (Reject immediately if violated)
    if (req.dealerId !== vehicle.dealerId) {
      return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false };
    }

    if (vehicle.status !== 'available' || req.status !== 'searching') {
      return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false };
    }

    if (pref?.make && pref.make.toLowerCase() !== vehicle.make.toLowerCase()) {
      return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false };
    }

    if (pref?.model && pref.model.toLowerCase() !== vehicle.model.toLowerCase()) {
      return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false };
    }

    if (pref?.fuel && vehicle.fuel && pref.fuel.toLowerCase() !== vehicle.fuel.toLowerCase()) {
      return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false };
    }

    if (pref?.transmission && vehicle.transmission && pref.transmission.toLowerCase() !== vehicle.transmission.toLowerCase()) {
      return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false };
    }

    // 1. Make / Model score (Max 30)
    let makeModelScore = 30;

    // 2. Budget score (Max 25)
    let budgetScore = 25;
    const price = Number(vehicle.price);
    const minPrice = pref?.minPrice ? Number(pref.minPrice) : null;
    const maxPrice = pref?.maxPrice ? Number(pref.maxPrice) : null;

    if (maxPrice !== null && price > maxPrice) {
      const overBudgetPct = (price - maxPrice) / maxPrice;
      if (overBudgetPct > 0.15) {
        return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false }; // Hard budget reject > 15% over
      }
      budgetScore = Math.max(0, Math.round(25 * (1 - overBudgetPct / 0.15)));
    } else if (minPrice !== null && price < minPrice * 0.8) {
      budgetScore = 15; // lower than target budget range
    }

    // 3. Year score (Max 15)
    let yearScore = 15;
    const minYear = pref?.minYear;
    const maxYear = pref?.maxYear;

    if (minYear && vehicle.year < minYear) {
      const diff = minYear - vehicle.year;
      if (diff > 2) {
        return { score: 0, breakdown: this.emptyBreakdown(), isEligible: false }; // Hard year reject > 2 years older
      }
      yearScore = diff === 1 ? 8 : 4;
    } else if (maxYear && vehicle.year > maxYear) {
      yearScore = 12;
    }

    // 4. Fuel score (Max 10)
    let fuelScore = 10;
    if (pref?.fuel && vehicle.fuel) {
      fuelScore = pref.fuel.toLowerCase() === vehicle.fuel.toLowerCase() ? 10 : 0;
    }

    // 5. Transmission score (Max 10)
    let transmissionScore = 10;
    if (pref?.transmission && vehicle.transmission) {
      transmissionScore = pref.transmission.toLowerCase() === vehicle.transmission.toLowerCase() ? 10 : 0;
    }

    // 6. Kilometers score (Max 5)
    let kmScore = 5;
    if (pref?.maxKm && vehicle.kilometers) {
      if (vehicle.kilometers > pref.maxKm) {
        const overKmPct = (vehicle.kilometers - pref.maxKm) / pref.maxKm;
        kmScore = overKmPct > 0.3 ? 0 : Math.round(5 * (1 - overKmPct / 0.3));
      }
    }

    // 7. Location score (Max 5)
    let locationScore = 5;

    const total = makeModelScore + budgetScore + yearScore + fuelScore + transmissionScore + kmScore + locationScore;

    const breakdown: MatchScoreBreakdown = {
      make_model: makeModelScore,
      budget: budgetScore,
      year: yearScore,
      fuel: fuelScore,
      transmission: transmissionScore,
      kilometers: kmScore,
      location: locationScore,
      total,
    };

    return {
      score: total,
      breakdown,
      isEligible: total >= 50,
    };
  }

  private emptyBreakdown(): MatchScoreBreakdown {
    return {
      make_model: 0,
      budget: 0,
      year: 0,
      fuel: 0,
      transmission: 0,
      kilometers: 0,
      location: 0,
      total: 0,
    };
  }

  /**
   * Runs matching for a newly created or updated vehicle against candidate searching requirements.
   */
  async matchVehicleAgainstRequirements(vehicleId: string) {
    const dealerId = requireDealerId();

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, dealerId },
    });

    if (!vehicle || vehicle.status !== 'available') return [];

    // SQL candidate filtering: find active requirements in same dealer with matching make/model bounds
    const candidates = await this.prisma.requirement.findMany({
      where: {
        dealerId,
        status: 'searching',
        preferences: {
          OR: [
            { make: null },
            { make: { equals: vehicle.make, mode: 'insensitive' } },
          ],
        },
      },
      include: { preferences: true },
    });

    const matchesCreated = [];

    for (const candidate of candidates) {
      const vehicleInput: VehicleMatchInput = {
        id: vehicle.id,
        dealerId: vehicle.dealerId,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant,
        year: vehicle.year,
        price: Number(vehicle.price),
        fuel: vehicle.fuel,
        transmission: vehicle.transmission,
        kilometers: vehicle.kilometers,
        status: vehicle.status,
      };

      const reqInput: RequirementMatchInput = {
        id: candidate.id,
        dealerId: candidate.dealerId,
        customerId: candidate.customerId,
        status: candidate.status,
        preferences: candidate.preferences
          ? {
              make: candidate.preferences.make,
              model: candidate.preferences.model,
              minYear: candidate.preferences.minYear,
              maxYear: candidate.preferences.maxYear,
              minPrice: candidate.preferences.minPrice ? Number(candidate.preferences.minPrice) : null,
              maxPrice: candidate.preferences.maxPrice ? Number(candidate.preferences.maxPrice) : null,
              fuel: candidate.preferences.fuel,
              transmission: candidate.preferences.transmission,
              maxKm: candidate.preferences.maxKm,
            }
          : null,
      };

      const result = this.calculateScore(reqInput, vehicleInput);

      if (result.isEligible && result.score >= 60) {
        const savedMatch = await this.upsertMatch(
          dealerId,
          candidate.id,
          vehicle.id,
          candidate.customerId,
          result.score,
          result.breakdown
        );
        matchesCreated.push(savedMatch);
      }
    }

    return matchesCreated;
  }

  /**
   * Persists or updates a match record in database and emits Outbox Event.
   */
  async upsertMatch(
    dealerId: string,
    requirementId: string,
    vehicleId: string,
    customerId: string,
    score: number,
    breakdown: MatchScoreBreakdown
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const match = await tx.match.upsert({
        where: {
          requirementId_vehicleId: {
            requirementId,
            vehicleId,
          },
        },
        create: {
          dealerId,
          requirementId,
          vehicleId,
          score,
          scoreBreakdown: breakdown as any,
          status: MatchStatus.NEW,
        },
        update: {
          score,
          scoreBreakdown: breakdown as any,
          updatedAt: new Date(),
        },
      });

      // If match score >= NOTIFICATION_THRESHOLD (75), emit MatchCreated event for notifications
      if (score >= MatchingService.NOTIFICATION_THRESHOLD) {
        await tx.outboxEvent.create({
          data: {
            dealerId,
            eventType: 'MatchCreated',
            aggregateType: 'Match',
            aggregateId: match.id,
            payload: {
              matchId: match.id,
              dealerId,
              requirementId,
              vehicleId,
              customerId,
              score,
            },
            status: 'pending',
          },
        });
      }

      return match;
    });
  }
}
