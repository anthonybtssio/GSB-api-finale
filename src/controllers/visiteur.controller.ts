import express from 'express';
import jwt from 'jsonwebtoken';
import { Visiteur } from '../models/Visiteur.js';
import { VisiteurService } from '../services/visiteur.service.js';

/**
 * Controller pour gérer les opérations CRUD sur les visiteurs
 */
export class VisiteurController {
  private visiteurService: VisiteurService;

  constructor() {
    this.visiteurService = new VisiteurService();
  }
  /**
   * Inscription d'un nouveau visiteur
   */
  async signup(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { nom, prenom, tel, email, password, date_embauche } = req.body;

      const existingVisiteur = await Visiteur.findOne({ email });
      if (existingVisiteur) {
        res.status(400).json({ message: 'Un visiteur avec cet email existe déjà' });
        return;
      }

      const visiteur = await Visiteur.create({ nom, prenom, tel, email, password, date_embauche });

      const token = jwt.sign(
        { userId: visiteur._id, role: 'visiteur' },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h', algorithm: 'HS256' }
      );

      res.status(201).json({
        message: 'Compte créé avec succès',
        token,
        visiteur: { id: visiteur._id, nom: visiteur.nom, prenom: visiteur.prenom, email: visiteur.email }
      });
    } catch (error) {
      res.status(400).json({
        message: 'Erreur lors de l\'inscription',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Connexion d'un visiteur
   */
  async login(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const visiteur = await Visiteur.findOne({ email });
      if (!visiteur) {
        res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        return;
      }

      const isMatch = await visiteur.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        return;
      }

      const token = jwt.sign(
        { userId: visiteur._id, role: 'visiteur' },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h', algorithm: 'HS256' }
      );

      res.status(200).json({
        message: 'Connexion réussie',
        token,
        visiteur: { id: visiteur._id, nom: visiteur.nom, prenom: visiteur.prenom, email: visiteur.email }
      });
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la connexion',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère tous les visiteurs
   * Sécurité: Retourne uniquement _id, nom, prénom, email, tel
   */
  async getAllVisiteurs(req: express.Request, res: express.Response): Promise<void> {
    try {
      const visiteurs = await Visiteur.find()
        .select('-_id nom prenom email tel')
        .sort({ nom: 1, prenom: 1 });

      res.status(200).json({
        success: true,
        count: visiteurs.length,
        data: visiteurs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des visiteurs',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère un visiteur par son ID
   * Sécurité: Retourne uniquement _id, nom, prénom, email, tel
   */
  async getVisiteurById(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const visiteur = await Visiteur.findById(id)
        .select('_id nom prenom email tel');

      if (!visiteur) {
        res.status(404).json({
          success: false,
          message: 'Visiteur non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: visiteur
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du visiteur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Crée un nouveau visiteur
   */
  async createVisiteur(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { nom, prenom, tel, email, date_embauche } = req.body;

      

      // Vérifier si l'email existe déjà
      const existingVisiteur = await Visiteur.findOne({ email });
      if (existingVisiteur) {
        res.status(400).json({
          success: false,
          message: 'Un visiteur avec cet email existe déjà'
        });
        return;
      }

      const visiteur = await Visiteur.create({
        nom,
        prenom,
        tel,
        email,
        date_embauche
      });

      res.status(201).json({
        success: true,
        message: 'Visiteur créé avec succès',
        data: visiteur
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création du visiteur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Met à jour un visiteur
   */
  async updateVisiteur(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, prenom, tel, email, date_embauche } = req.body;

      // Vérifier si l'email existe déjà pour un autre visiteur
      if (email) {
        const existingVisiteur = await Visiteur.findOne({ email, _id: { $ne: id as string } });
        if (existingVisiteur) {
          res.status(400).json({
            success: false,
            message: 'Un visiteur avec cet email existe déjà'
          });
          return;
        }
      }

      const visiteur = await Visiteur.findByIdAndUpdate(
        id,
        { nom, prenom, tel, email, date_embauche },
        { new: true, runValidators: true }
      );

      if (!visiteur) {
        res.status(404).json({
          success: false,
          message: 'Visiteur non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Visiteur mis à jour avec succès',
        data: visiteur
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du visiteur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Supprime un visiteur
   */
  async deleteVisiteur(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const visiteur = await Visiteur.findByIdAndDelete(id);

      if (!visiteur) {
        res.status(404).json({
          success: false,
          message: 'Visiteur non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Visiteur supprimé avec succès',
        data: visiteur
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du visiteur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Recherche des visiteurs par nom ou prénom
   */
  async searchVisiteurs(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Paramètre de recherche manquant'
        });
        return;
      }

      const visiteurs = await Visiteur.find({
        $or: [
          { nom: { $regex: q, $options: 'i' } },
          { prenom: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).sort({ nom: 1, prenom: 1 });

      res.status(200).json({
        success: true,
        count: visiteurs.length,
        data: visiteurs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des visiteurs',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Ajoute un praticien au portefeuille d'un visiteur
   */
  async addPraticienToPortefeuille(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId } = req.params;
      const { praticienId } = req.body;

      const visiteur = await this.visiteurService.addPraticienToPortefeuille(
        visiteurId as string,
        praticienId
      );

      res.status(201).json({
        success: true,
        message: 'Praticien ajouté au portefeuille avec succès',
        data: visiteur
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du praticien'
      });
    }
  }

  /**
   * Récupère le portefeuille de praticiens d'un visiteur
   */
  async getPortefeuillePraticiens(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { visiteurId } = req.params;

      const praticiens = await this.visiteurService.getPortefeuillePraticiens(visiteurId as string);

      res.status(200).json({
        success: true,
        count: praticiens.length,
        data: praticiens
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération du portefeuille'
      });
    }
  }
}
