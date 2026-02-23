import prisma from '../services/prisma.service.js';

export async function addFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const { workshopId } = req.params;

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) {
      const error = new Error('Workshop not found');
      error.status = 404;
      throw error;
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_workshopId: {
          userId,
          workshopId
        }
      },
      update: {},
      create: { userId, workshopId },
      include: {
        workshop: true
      }
    });

    res.status(201).json(favorite);
  } catch (error) {
    next(error);
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const { workshopId } = req.params;

    await prisma.favorite.delete({
      where: {
        userId_workshopId: {
          userId,
          workshopId
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Favorite not found';
    }
    next(error);
  }
}

export async function getFavorites(req, res, next) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.userId },
      include: {
        workshop: {
          include: {
            reviews: {
              select: { rating: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = favorites.map((favorite) => {
      const total = favorite.workshop.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = favorite.workshop.reviews.length
        ? Number((total / favorite.workshop.reviews.length).toFixed(2))
        : 0;

      return {
        ...favorite,
        workshop: {
          ...favorite.workshop,
          averageRating,
          reviewCount: favorite.workshop.reviews.length
        }
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
