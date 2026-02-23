import prisma from '../services/prisma.service.js';

export async function addReview(req, res, next) {
  try {
    const { workshopId } = req.params;

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) {
      const error = new Error('Workshop not found');
      error.status = 404;
      throw error;
    }

    const review = await prisma.review.create({
      data: {
        rating: req.body.rating,
        comment: req.body.comment,
        workshopId,
        userId: req.user.userId
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

export async function getWorkshopReviews(req, res, next) {
  try {
    const { workshopId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { workshopId },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2))
      : 0;

    res.json({
      averageRating,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
}
