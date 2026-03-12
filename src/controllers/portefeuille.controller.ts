import express from 'express';
import { PortefeuilleService } from '../services/portefeuille.service.js';

/**
 * Controller pour gérer les opérations sur le portefeuille visiteur/praticien
 */
export class PortefeuilleController {
  private portefeuilleService: PortefeuilleService;

  constructor() {
    this.portefeuilleService = new PortefeuilleService();
  }

  /**
   * Ajoute un praticien au portefeuille d'un visiteur
   */
  async addPraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId, praticienId } = req.body;
      const { notes } = req.body;

      if (!visiteurId || !praticienId) {
        res.status(400).json({
          success: false,
          message: 'L\'ID du visiteur et du praticien sont requis'
        });
        return;
      }

      const portefeuille = await this.portefeuilleService.addPraticien({
        visiteur: visiteurId,
        praticien: praticienId,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Praticien ajouté au portefeuille avec succès',
        data: portefeuille
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('déjà') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'ajout au portefeuille'
      });
    }
  }

  /**
   * Retire un praticien du portefeuille d'un visiteur (désactivation)
   */
  async removePraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId, praticienId } = req.params;

      if (!visiteurId || !praticienId) {
        res.status(400).json({
          success: false,
          message: 'L\'ID du visiteur et du praticien sont requis'
        });
        return;
      }

      await this.portefeuilleService.removePraticien(visiteurId, praticienId);

      res.status(200).json({
        success: true,
        message: 'Praticien retiré du portefeuille avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du retrait du portefeuille'
      });
    }
  }

  /**
   * Supprime définitivement une relation du portefeuille
   */
  async deleteRelation(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId, praticienId } = req.params;

      if (!visiteurId || !praticienId) {
        res.status(400).json({
          success: false,
          message: 'L\'ID du visiteur et du praticien sont requis'
        });
        return;
      }

      await this.portefeuilleService.deleteRelation(visiteurId, praticienId);

      res.status(200).json({
        success: true,
        message: 'Relation supprimée définitivement du portefeuille'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression de la relation'
      });
    }
  }

  /**
   * Récupère le portefeuille d'un visiteur
   */
  async getByVisiteur(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId } = req.params;

      if (!visiteurId) {
        res.status(400).json({
          success: false,
          message: 'L\'ID du visiteur est requis'
        });
        return;
      }

      const actifOnly = req.query.actif !== 'false';
      const portefeuille = await this.portefeuilleService.getByVisiteur(visiteurId, actifOnly);

      res.status(200).json({
        success: true,
        count: portefeuille.length,
        data: portefeuille
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération du portefeuille'
      });
    }
  }

  /**
   * Récupère tous les visiteurs associés à un praticien
   */
  async getByPraticien(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { praticienId } = req.params;

      if (!praticienId) {
        res.status(400).json({
          success: false,
          message: 'L\'ID du praticien est requis'
        });
        return;
      }

      const actifOnly = req.query.actif !== 'false';
      const portefeuille = await this.portefeuilleService.getByPraticien(praticienId, actifOnly);

      res.status(200).json({
        success: true,
        count: portefeuille.length,
        data: portefeuille
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération des visiteurs associés'
      });
    }
  }

  /**
   * Met à jour les notes d'une relation visiteur/praticien
   */
  async updateNotes(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId, praticienId } = req.params;
      const { notes } = req.body;

      if (!visiteurId || !praticienId) {
        res.status(400).json({
          success: false,
          message: 'L\'ID du visiteur et du praticien sont requis'
        });
        return;
      }

      if (notes === undefined) {
        res.status(400).json({
          success: false,
          message: 'Les notes sont requises'
        });
        return;
      }

      const portefeuille = await this.portefeuilleService.updateNotes(
        visiteurId,
        praticienId,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Notes mises à jour avec succès',
        data: portefeuille
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour des notes'
      });
    }
  }

  /**
   * Récupère toutes les relations du portefeuille
   */
  async getAll(req: express.Request, res: express.Response): Promise<void> {
    try {
      const actifOnly = req.query.actif !== 'false';

      const portefeuilles = await this.portefeuilleService.getAll(actifOnly);

      res.status(200).json({
        success: true,
        count: portefeuilles.length,
        data: portefeuilles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des portefeuilles',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
