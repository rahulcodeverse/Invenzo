import { PaginatedResult } from '../dto/pagination.dto';

export class PaginationHelper {
  static paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  static getSkipTake(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const take = limit;

    return { skip, take };
  }
}

