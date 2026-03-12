import express from 'express';
import { Praticien } from '../models/Praticien.js';

/**
 * Controller pour gérer les opérations CRUD sur les praticiens
 */
export class PraticienController {
  /**
   * Récupère tous les praticiens
   */
  async getAllPraticiens(req: express.Request, res: express.Response): Promise<void> {
    try {
      const praticiens = await Praticien.find()
        .populate('visites')
        .sort({ nom: 1, prenom: 1 });

      res.status(200).json({
        success: true,
        count: praticiens.length,
        data: praticiens
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des praticiens',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère un praticien par son ID
   */
  async getPraticienById(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const praticien = await Praticien.findById(id).populate('visites');

      if (!praticien) {
        res.status(404).json({
          success: false,
          message: 'Praticien non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: praticien
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du praticien',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère les praticiens par ville
   */
  async getPraticiensByVille(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { ville } = req.params;

      const praticiens = await Praticien.find({
        ville: { $regex: ville as string, $options: 'i' }
      }).sort({ nom: 1, prenom: 1 });

      res.status(200).json({
        success: true,
        count: praticiens.length,
        data: praticiens
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des praticiens par ville',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Crée un nouveau praticien
   */
  async createPraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { nom, prenom, tel, email, rue, code_postal, ville } = req.body;

      // Vérifier si l'email existe déjà
      const existingPraticien = await Praticien.findOne({ email });
      if (existingPraticien) {
        res.status(400).json({
          success: false,
          message: 'Un praticien avec cet email existe déjà'
        });
        return;
      }

      const praticien = await Praticien.create({
        nom,
        prenom,
        tel,
        email,
        rue,
        code_postal,
        ville
      });

      res.status(201).json({
        success: true,
        message: 'Praticien créé avec succès',
        data: praticien
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création du praticien',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Met à jour un praticien
   */
  async updatePraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, prenom, tel, email, rue, code_postal, ville } = req.body;

      // Si l'email est modifié, vérifier qu'il n'existe pas déjà
      if (email) {
        const existingPraticien = await Praticien.findOne({
          email,
          _id: { $ne: id as string }
        });
        if (existingPraticien) {
          res.status(400).json({
            success: false,
            message: 'Un praticien avec cet email existe déjà'
          });
          return;
        }
      }

      const praticien = await Praticien.findByIdAndUpdate(
        id,
        { nom, prenom, tel, email, rue, code_postal, ville },
        { new: true, runValidators: true }
      );

      if (!praticien) {
        res.status(404).json({
          success: false,
          message: 'Praticien non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Praticien mis à jour avec succès',
        data: praticien
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du praticien',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Supprime un praticien
   */
  async deletePraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const praticien = await Praticien.findByIdAndDelete(id);

      if (!praticien) {
        res.status(404).json({
          success: false,
          message: 'Praticien non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Praticien supprimé avec succès',
        data: praticien
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du praticien',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Recherche des praticiens par nom, prénom, email ou ville
   */
  async searchPraticiens(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Paramètre de recherche manquant'
        });
        return;
      }

      const praticiens = await Praticien.find({
        $or: [
          { nom: { $regex: q, $options: 'i' } },
          { prenom: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { ville: { $regex: q, $options: 'i' } }
        ]
      }).sort({ nom: 1, prenom: 1 });

      res.status(200).json({
        success: true,
        count: praticiens.length,
        data: praticiens
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des praticiens',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
