jest.mock('../models/Visiteur', () => ({
  Visiteur: Object.assign(jest.fn(), {
    findOne: jest.fn(),
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
const EMAIL = 'jean.dupont@gsb.fr';

const visiteurData = {
  _id: VISITEUR_ID,
  nom: 'Dupont',
  prenom: 'Jean',
  tel: '0612345678',
  email: EMAIL,
  date_embauche: new Date('2020-01-01'),
};

describe('VisiteurService', () => {
  let service: VisiteurService;

  beforeEach(() => {
    service = new VisiteurService();
    jest.clearAllMocks();
  });

  // =========================================================
  describe('create', () => {
    test('crée un visiteur avec succès (email libre)', async () => {
      // ARRANGE
      (Visiteur.findOne as jest.Mock).mockResolvedValue(null);

      const mockInstance = {
        save: jest.fn().mockResolvedValue(visiteurData),
      };
      (Visiteur as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT
      const result = await service.create(visiteurData);

      // ASSERT
      expect(result).toBeDefined();
      expect(Visiteur.findOne).toHaveBeenCalledWith({ email: EMAIL });
      expect(mockInstance.save).toHaveBeenCalled();
    });

    test('lance une erreur si l\'email existe déjà', async () => {
      // ARRANGE
      (Visiteur.findOne as jest.Mock).mockResolvedValue(visiteurData);

      const mockInstance = { save: jest.fn() };
      (Visiteur as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT / ASSERT
      await expect(service.create(visiteurData)).rejects.toThrow(
        `Un visiteur avec l'email ${EMAIL} existe déjà`
      );

      expect(Visiteur.findOne).toHaveBeenCalledWith({ email: EMAIL });
      expect(mockInstance.save).not.toHaveBeenCalled();
    });

    test('lance une erreur de validation Mongoose si les données sont invalides', async () => {
      // ARRANGE
      (Visiteur.findOne as jest.Mock).mockResolvedValue(null);

      const validationError = Object.assign(new Error('Validation failed'), {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email invalide' },
          nom: { message: 'Le nom est requis' },
        },
      });

      const mockInstance = {
        save: jest.fn().mockRejectedValue(validationError),
      };
      (Visiteur as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT / ASSERT
      await expect(
        service.create({ email: 'mauvais-email', date_embauche: new Date() })
      ).rejects.toThrow('Validation échouée:');

      await expect(
        service.create({ email: 'mauvais-email', date_embauche: new Date() })
      ).rejects.toThrow(/Email invalide|Le nom est requis/);
    });
  });

  // =========================================================
  describe('isJunior', () => {
    test('retourne true si embauché il y a moins d\'1 an', () => {
      // ARRANGE — date d'embauche il y a 6 mois
      const sixMoisAvant = new Date();
      sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 6);

      // ACT / ASSERT
      expect(service.isJunior(sixMoisAvant)).toBe(true);
    });

    test('retourne true si embauché exactement hier', () => {
      // ARRANGE
      const hier = new Date();
      hier.setDate(hier.getDate() - 1);

      // ACT / ASSERT
      expect(service.isJunior(hier)).toBe(true);
    });

    test('retourne false si embauché il y a plus d\'1 an', () => {
      // ARRANGE — date d'embauche il y a 2 ans
      const deuxAnsAvant = new Date();
      deuxAnsAvant.setFullYear(deuxAnsAvant.getFullYear() - 2);

      // ACT / ASSERT
      expect(service.isJunior(deuxAnsAvant)).toBe(false);
    });

    test('retourne false si embauché exactement il y a 1 an et 1 jour', () => {
      // ARRANGE
      const unAnEtUnJourAvant = new Date();
      unAnEtUnJourAvant.setFullYear(unAnEtUnJourAvant.getFullYear() - 1);
      unAnEtUnJourAvant.setDate(unAnEtUnJourAvant.getDate() - 1);

      // ACT / ASSERT
      expect(service.isJunior(unAnEtUnJourAvant)).toBe(false);
    });

    test('retourne true si date_embauche est undefined (junior par défaut)', () => {
      // ACT / ASSERT
      expect(service.isJunior(undefined)).toBe(true);
    });

    test('retourne true si date_embauche est null (junior par défaut)', () => {
      // ACT / ASSERT
      expect(service.isJunior(null)).toBe(true);
    });
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
