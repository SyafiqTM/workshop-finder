import prisma from '../services/prisma.service.js';
import { haversineDistance } from '../utils/distance.js';

const workshopInclude = {
  reviews: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true } }
    }
  }
};

function mapWorkshopWithAvg(workshop) {
  const total = workshop.reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = workshop.reviews.length ? Number((total / workshop.reviews.length).toFixed(2)) : 0;

  return {
    ...workshop,
    averageRating,
    reviewCount: workshop.reviews.length
  };
}

export async function getWorkshops(_req, res, next) {
  try {
    const workshops = await prisma.workshop.findMany({
      include: workshopInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json(workshops.map(mapWorkshopWithAvg));
  } catch (error) {
    next(error);
  }
}

export async function getWorkshopById(req, res, next) {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: req.params.id },
      include: workshopInclude
    });

    if (!workshop) {
      const error = new Error('Workshop not found');
      error.status = 404;
      throw error;
    }

    res.json(mapWorkshopWithAvg(workshop));
  } catch (error) {
    next(error);
  }
}

export async function getNearbyWorkshops(req, res, next) {
  try {
    const { lat, lng, radiusKm = 50 } = req.query;

    const workshops = await prisma.workshop.findMany({
      include: workshopInclude
    });

    const nearby = workshops
      .map((workshop) => {
        const distanceKm = haversineDistance(lat, lng, workshop.latitude, workshop.longitude);
        return {
          ...mapWorkshopWithAvg(workshop),
          distanceKm: Number(distanceKm.toFixed(2))
        };
      })
      .filter((workshop) => workshop.distanceKm <= radiusKm)
      .sort((first, second) => first.distanceKm - second.distanceKm);

    res.json(nearby);
  } catch (error) {
    next(error);
  }
}

export async function createWorkshop(req, res, next) {
  try {
    const workshop = await prisma.workshop.create({
      data: req.body
    });

    res.status(201).json(workshop);
  } catch (error) {
    next(error);
  }
}
