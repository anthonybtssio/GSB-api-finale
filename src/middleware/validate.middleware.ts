import { validationResult } from 'express-validator';
import express from 'express';

/**
 * Middleware de validation générique
 *
 * Ce middleware intercepte les requêtes et vérifie si des erreurs de validation
 * ont été détectées par express-validator.
 *
 * Utilité :
 * - Centralise la gestion des erreurs de validation
 * - Empêche les données invalides d'atteindre les contrôleurs
 * - Retourne des messages d'erreur clairs et structurés
 * - Améliore la sécurité en validant toutes les entrées utilisateur
 *
 * @param req - Requête Express
 * @param res - Réponse Express
 * @param next - Fonction next pour passer au middleware suivant
 */
export const validate = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
    return;
  }

  next();
};
