import { Types } from 'mongoose';
import { Visiteur, type IVisiteur } from '../models/Visiteur.js';
import { Praticien, type IPraticien } from '../models/Praticien.js';

/**
 * Service pour gérer la logique métier des visiteurs
 */
export class VisiteurService {
  /**
   * Crée un nouveau visiteur après vérification de l'unicité de l'email
   * @param data - Les données du visiteur à créer
   * @returns Le visiteur créé
   */
  public async create(data: Partial<IVisiteur>): Promise<IVisiteur> {
    // Vérifier que l'email n'est pas déjà utilisé
    const existing = await Visiteur.findOne({ email: data.email });
    if (existing) {
      throw new Error(`Un visiteur avec l'email ${data.email} existe déjà`);
    }

    try {
      const visiteur = new Visiteur(data);
      return await visiteur.save();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ValidationError') {
        const details = Object.values((err as any).errors)
          .map((e: any) => e.message)
          .join(', ');
        throw new Error(`Validation échouée: ${details}`);
      }
      throw err;
    }
  }

  /**
   * Ajoute un praticien au portefeuille d'un visiteur
   * @param visiteurId - L'ID du visiteur
   * @param praticienId - L'ID du praticien à ajouter
   * @returns Le visiteur mis à jour avec son portefeuille
   */
  public async addPraticienToPortefeuille(
    visiteurId: string,
    praticienId: string
  ): Promise<IVisiteur> {
    // Validation des IDs
    if (!Types.ObjectId.isValid(visiteurId) || !Types.ObjectId.isValid(praticienId)) {
      throw new Error('ID visiteur ou praticien invalide');
    }

    // Vérifier que le praticien existe
    const praticien = await Praticien.findById(praticienId).select('_id').lean();
    if (!praticien) {
      throw new Error(`Praticien avec l'ID ${praticienId} introuvable`);
    }

    // Ajouter le praticien au portefeuille (évite les doublons avec $addToSet)
    const visiteurUpdated = await Visiteur.findByIdAndUpdate(
      visiteurId,
      { $addToSet: { portefeuillePraticiens: praticienId } },
      { new: true, runValidators: true }
    ).populate('portefeuillePraticiens');

    if (!visiteurUpdated) {
      throw new Error(`Visiteur avec l'ID ${visiteurId} introuvable`);
    }

    return visiteurUpdated;
  }

  /**
   * Détermine si un visiteur est considéré junior
   * @param dateEmbauche - La date d'embauche du visiteur (undefined/null = junior par défaut)
   * @returns true si embauché il y a moins d'1 an, ou si pas de date d'embauche
   */
  public isJunior(dateEmbauche: Date | undefined | null): boolean {
    if (!dateEmbauche) {
      return true;
    }

    const unAnAvant = new Date();
    unAnAvant.setFullYear(unAnAvant.getFullYear() - 1);

    return dateEmbauche > unAnAvant;
  }

  /**
   * Récupère le portefeuille de praticiens d'un visiteur
   * @param visiteurId - L'ID du visiteur
   * @returns Le tableau des praticiens du portefeuille
   */
  public async getPortefeuillePraticiens(visiteurId: string): Promise<IPraticien[]> {
    // Validation de l'ID
    if (!Types.ObjectId.isValid(visiteurId)) {
      throw new Error('ID visiteur invalide');
    }

    // Rechercher le visiteur et populer son portefeuille
    const visiteur = await Visiteur.findById(visiteurId).populate('portefeuillePraticiens');

    if (!visiteur) {
      throw new Error(`Visiteur avec l'ID ${visiteurId} introuvable`);
    }

    // Retourner uniquement le tableau des praticiens
    return visiteur.portefeuillePraticiens as unknown as IPraticien[];
  }

  /**
   * Récupère un visiteur par son ID
   * @param visiteurId - L'ID du visiteur
   * @returns Le visiteur trouvé
   */
  public async getVisiteurById(visiteurId: string): Promise<IVisiteur> {
    // Validation de l'ID
    if (!Types.ObjectId.isValid(visiteurId)) {
      throw new Error('ID visiteur invalide');
    }

    // Rechercher le visiteur
    const visiteur = await Visiteur.findById(visiteurId);

    if (!visiteur) {
      throw new Error(`Visiteur avec l'ID ${visiteurId} introuvable`);
    }

    return visiteur;
  }
}
