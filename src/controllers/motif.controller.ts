
import express from 'express';
import { Motif } from '../models/Motif.js';

/**
 * Controller pour gérer les opérations CRUD sur les motifs
 */
export class MotifController {
  /**
   * Récupère tous les motifs
   */
  async getAllMotifs(req: express.Request, res: express.Response): Promise<void> {
    try {
      const motifs = await Motif.find().sort({ libelle: 1 });

      res.status(200).json({
        success: true,
        count: motifs.length,
        data: motifs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des motifs',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère un motif par son ID
   */
  async getMotifById(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const motif = await Motif.findById(id);

      if (!motif) {
        res.status(404).json({
          success: false,
          message: 'Motif non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: motif
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du motif',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Crée un nouveau motif
   */
  async createMotif(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { libelle } = req.body;

      // Vérifier si le libellé existe déjà
      const existingMotif = await Motif.findOne({ libelle });
      if (existingMotif) {
        res.status(400).json({
          success: false,
          message: 'Un motif avec ce libellé existe déjà'
        });
        return;
      }

      const motif = await Motif.create({ libelle });

      res.status(201).json({
        success: true,
        message: 'Motif créé avec succès',
        data: motif
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création du motif',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }


  /**
   * Met à jour un motif
   */
  async updateMotif(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { libelle } = req.body;

      // Vérifier si un autre motif avec ce libellé existe déjà
      const existingMotif = await Motif.findOne({
        libelle,
        _id: { $ne: id as string }
      });

      if (existingMotif) {
        res.status(400).json({
          success: false,
          message: 'Un motif avec ce libellé existe déjà'
        });
        return;
      }

      const motif = await Motif.findByIdAndUpdate(
        id,
        { libelle },
        { new: true, runValidators: true }
      );

      if (!motif) {
        res.status(404).json({
          success: false,
          message: 'Motif non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Motif mis à jour avec succès',
        data: motif
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du motif',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Supprime un motif
   */
  async deleteMotif(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const motif = await Motif.findByIdAndDelete(id);

      if (!motif) {
        res.status(404).json({
          success: false,
          message: 'Motif non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Motif supprimé avec succès',
        data: motif
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du motif',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Recherche des motifs par libellé
   */
  async searchMotifs(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Paramètre de recherche manquant'
        });
        return;
      }

      const motifs = await Motif.find({
        libelle: { $regex: q, $options: 'i' }
      }).sort({ libelle: 1 });

      res.status(200).json({
        success: true,
        count: motifs.length,
        data: motifs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des motifs',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
