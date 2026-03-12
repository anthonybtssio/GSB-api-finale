import express from 'express';
import { Visite } from '../models/Visite.js';
import { Visiteur } from '../models/Visiteur.js';
import { Praticien } from '../models/Praticien.js';
import { Motif } from '../models/Motif.js';

/**
 * Controller pour gérer les opérations CRUD sur les visites
 */
export class VisiteController {
  /**
   * Récupère toutes les visites
   */
  async getAllVisites(req: express.Request, res: express.Response): Promise<void> {
    try {
      const visites = await Visite.find()
        .populate('visiteur', 'nom prenom email')
        .populate('praticien', 'nom prenom email ville')
        .populate('motif', 'libelle')
        .sort({ date_visite: -1 });

      res.status(200).json({
        success: true,
        count: visites.length,
        data: visites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des visites',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère une visite par son ID
   */
  async getVisiteById(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const visite = await Visite.findById(id)
        .populate('visiteur', 'nom prenom email tel')
        .populate('praticien', 'nom prenom email tel ville')
        .populate('motif', 'libelle');

      if (!visite) {
        res.status(404).json({
          success: false,
          message: 'Visite non trouvée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: visite
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la visite',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère les visites d'un visiteur
   */
  async getVisitesByVisiteur(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId } = req.params;

      const visites = await Visite.find({ visiteur: visiteurId as string })
        .populate('visiteur', 'nom prenom email')
        .populate('praticien', 'nom prenom email ville')
        .populate('motif', 'libelle')
        .sort({ date_visite: -1 });

      res.status(200).json({
        success: true,
        count: visites.length,
        data: visites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des visites du visiteur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère les visites d'un praticien
   */
  async getVisitesByPraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { praticienId } = req.params;

      const visites = await Visite.find({ praticien: praticienId as string })
        .populate('visiteur', 'nom prenom email')
        .populate('praticien', 'nom prenom email ville')
        .populate('motif', 'libelle')
        .sort({ date_visite: -1 });

      res.status(200).json({
        success: true,
        count: visites.length,
        data: visites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des visites du praticien',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère les visites par motif
   */
  async getVisitesByMotif(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { motifId } = req.params;

      const visites = await Visite.find({ motif: motifId as string })
        .populate('visiteur', 'nom prenom email')
        .populate('praticien', 'nom prenom email ville')
        .populate('motif', 'libelle')
        .sort({ date_visite: -1 });

      res.status(200).json({
        success: true,
        count: visites.length,
        data: visites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des visites par motif',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère les visites dans une période donnée
   */
  async getVisitesByDateRange(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises'
        });
        return;
      }

      const visites = await Visite.find({
        date_visite: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      })
        .populate('visiteur', 'nom prenom email')
        .populate('praticien', 'nom prenom email ville')
        .populate('motif', 'libelle')
        .sort({ date_visite: -1 });

      res.status(200).json({
        success: true,
        count: visites.length,
        data: visites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des visites par période',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Crée une nouvelle visite
   */
  async createVisite(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { date_visite, commentaire, visiteur, praticien, motif } = req.body;

      // Vérifier que le visiteur existe
      const visiteurExists = await Visiteur.findById(visiteur);
      if (!visiteurExists) {
        res.status(404).json({
          success: false,
          message: 'Visiteur non trouvé'
        });
        return;
      }

      // Vérifier que le praticien existe
      const praticienExists = await Praticien.findById(praticien);
      if (!praticienExists) {
        res.status(404).json({
          success: false,
          message: 'Praticien non trouvé'
        });
        return;
      }

      // Vérifier que le motif existe
      const motifExists = await Motif.findById(motif);
      if (!motifExists) {
        res.status(404).json({
          success: false,
          message: 'Motif non trouvé'
        });
        return;
      }

      const visite = await Visite.create({
        date_visite,
        commentaire,
        visiteur,
        praticien,
        motif
      });

      // Populate avant de renvoyer
      await visite.populate([
        { path: 'visiteur', select: 'nom prenom email' },
        { path: 'praticien', select: 'nom prenom email ville' },
        { path: 'motif', select: 'libelle' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Visite créée avec succès',
        data: visite
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création de la visite',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Met à jour une visite
   */
  async updateVisite(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date_visite, commentaire, visiteur, praticien, motif } = req.body;

      // Vérifier que les références existent si elles sont fournies
      if (visiteur) {
        const visiteurExists = await Visiteur.findById(visiteur);
        if (!visiteurExists) {
          res.status(404).json({
            success: false,
            message: 'Visiteur non trouvé'
          });
          return;
        }
      }

      if (praticien) {
        const praticienExists = await Praticien.findById(praticien);
        if (!praticienExists) {
          res.status(404).json({
            success: false,
            message: 'Praticien non trouvé'
          });
          return;
        }
      }

      if (motif) {
        const motifExists = await Motif.findById(motif);
        if (!motifExists) {
          res.status(404).json({
            success: false,
            message: 'Motif non trouvé'
          });
          return;
        }
      }

      const visite = await Visite.findByIdAndUpdate(
        id,
        { date_visite, commentaire, visiteur, praticien, motif },
        { new: true, runValidators: true }
      )
        .populate('visiteur', 'nom prenom email')
        .populate('praticien', 'nom prenom email ville')
        .populate('motif', 'libelle');

      if (!visite) {
        res.status(404).json({
          success: false,
          message: 'Visite non trouvée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Visite mise à jour avec succès',
        data: visite
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la visite',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Supprime une visite
   */
  async deleteVisite(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const visite = await Visite.findByIdAndDelete(id);

      if (!visite) {
        res.status(404).json({
          success: false,
          message: 'Visite non trouvée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Visite supprimée avec succès',
        data: visite
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la visite',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère les statistiques des visites
   */
  async getVisitesStats(req: express.Request, res: express.Response): Promise<void> {
    try {
      const totalVisites = await Visite.countDocuments();
      const visitesParMotif = await Visite.aggregate([
        {
          $group: {
            _id: '$motif',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'motifs',
            localField: '_id',
            foreignField: '_id',
            as: 'motif'
          }
        },
        {
          $unwind: '$motif'
        },
        {
          $project: {
            motif: '$motif.libelle',
            count: 1
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const visitesParMois = await Visite.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$date_visite' },
              month: { $month: '$date_visite' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        },
        {
          $limit: 12
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalVisites,
          visitesParMotif,
          visitesParMois
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
