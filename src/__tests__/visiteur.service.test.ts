jest.mock('../models/Visiteur', () => ({
  Visiteur: Object.assign(jest.fn(), {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  }),
}));

jest.mock('../models/Praticien', () => ({
  Praticien: Object.assign(jest.fn(), {
    findById: jest.fn(),
  }),
}));

import { VisiteurService } from '../services/visiteur.service';
import { Visiteur } from '../models/Visiteur';
import { Praticien } from '../models/Praticien';

const VISITEUR_ID = '507f1f77bcf86cd799439011';
const PRATICIEN_ID = '507f1f77bcf86cd799439022';
const INVALID_ID = 'invalid-id';

describe('VisiteurService', () => {
  let service: VisiteurService;

  beforeEach(() => {
    service = new VisiteurService();
    jest.clearAllMocks();
  });

  // =========================================================
  describe('addPraticienToPortefeuille', () => {
    test('ajoute un praticien au portefeuille avec succès', async () => {
      // ARRANGE
      const visiteurUpdated = {
        _id: VISITEUR_ID,
        nom: 'Dupont',
        portefeuillePraticiens: [PRATICIEN_ID],
      };

      // Mock Praticien.findById().select('_id').lean()
      (Praticien.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: PRATICIEN_ID }),
        }),
      });

      // Mock Visiteur.findByIdAndUpdate().populate()
      (Visiteur.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(visiteurUpdated),
      });

      // ACT
      const result = await service.addPraticienToPortefeuille(VISITEUR_ID, PRATICIEN_ID);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.portefeuillePraticiens).toContain(PRATICIEN_ID);
      expect(Praticien.findById).toHaveBeenCalledWith(PRATICIEN_ID);
      expect(Visiteur.findByIdAndUpdate).toHaveBeenCalledWith(
        VISITEUR_ID,
        { $addToSet: { portefeuillePraticiens: PRATICIEN_ID } },
        { new: true, runValidators: true }
      );
    });

    test('lance une erreur si les IDs sont invalides', async () => {
      // ARRANGE / ACT / ASSERT
      await expect(
        service.addPraticienToPortefeuille(INVALID_ID, PRATICIEN_ID)
      ).rejects.toThrow('ID visiteur ou praticien invalide');

      await expect(
        service.addPraticienToPortefeuille(VISITEUR_ID, INVALID_ID)
      ).rejects.toThrow('ID visiteur ou praticien invalide');
    });

    test('lance une erreur si le praticien est introuvable', async () => {
      // ARRANGE
      (Praticien.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      // ACT / ASSERT
      await expect(
        service.addPraticienToPortefeuille(VISITEUR_ID, PRATICIEN_ID)
      ).rejects.toThrow(`Praticien avec l'ID ${PRATICIEN_ID} introuvable`);

      expect(Visiteur.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('lance une erreur si le visiteur est introuvable', async () => {
      // ARRANGE
      (Praticien.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: PRATICIEN_ID }),
        }),
      });

      (Visiteur.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      // ACT / ASSERT
      await expect(
        service.addPraticienToPortefeuille(VISITEUR_ID, PRATICIEN_ID)
      ).rejects.toThrow(`Visiteur avec l'ID ${VISITEUR_ID} introuvable`);
    });
  });

  // =========================================================
  describe('getPortefeuillePraticiens', () => {
    test('retourne le portefeuille du visiteur', async () => {
      // ARRANGE
      const praticiens = [
        { _id: PRATICIEN_ID, nom: 'Martin', prenom: 'Jean', ville: 'Paris' },
      ];
      const visiteurData = {
        _id: VISITEUR_ID,
        portefeuillePraticiens: praticiens,
      };

      (Visiteur.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(visiteurData),
      });

      // ACT
      const result = await service.getPortefeuillePraticiens(VISITEUR_ID);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(Visiteur.findById).toHaveBeenCalledWith(VISITEUR_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(
        service.getPortefeuillePraticiens(INVALID_ID)
      ).rejects.toThrow('ID visiteur invalide');

      expect(Visiteur.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si visiteur introuvable', async () => {
      // ARRANGE
      (Visiteur.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      // ACT / ASSERT
      await expect(
        service.getPortefeuillePraticiens(VISITEUR_ID)
      ).rejects.toThrow(`Visiteur avec l'ID ${VISITEUR_ID} introuvable`);
    });
  });
});
