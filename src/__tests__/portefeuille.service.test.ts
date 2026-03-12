jest.mock('../models/Portefeuille', () => ({
  Portefeuille: Object.assign(jest.fn(), {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  }),
}));

jest.mock('../models/Visiteur', () => ({
  Visiteur: Object.assign(jest.fn(), {
    findById: jest.fn(),
  }),
}));

jest.mock('../models/Praticien', () => ({
  Praticien: Object.assign(jest.fn(), {
    findById: jest.fn(),
  }),
}));

import { PortefeuilleService } from '../services/portefeuille.service';
import { Portefeuille } from '../models/Portefeuille';
import { Visiteur } from '../models/Visiteur';
import { Praticien } from '../models/Praticien';

const VISITEUR_ID  = '507f1f77bcf86cd799439011';
const PRATICIEN_ID = '507f1f77bcf86cd799439022';
const INVALID_ID   = 'invalid-id';

const portefeuilleData = {
  _id: '507f1f77bcf86cd799439099',
  visiteur: VISITEUR_ID,
  praticien: PRATICIEN_ID,
  actif: true,
  date_ajout: new Date(),
};

/** Mock chaîné : findById().select('_id').lean() */
function mockFindByIdSelectLean(mockFn: jest.Mock, returnValue: object | null) {
  mockFn.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(returnValue),
    }),
  });
}

describe('PortefeuilleService', () => {
  let service: PortefeuilleService;

  beforeEach(() => {
    service = new PortefeuilleService();
    jest.clearAllMocks();
  });

  // =========================================================
  describe('addPraticien', () => {
    test('ajoute un nouveau praticien au portefeuille avec succès', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, { _id: PRATICIEN_ID });

      // Aucune entrée existante
      (Portefeuille.findOne as jest.Mock).mockResolvedValue(null);

      const mockInstance = {
        save: jest.fn().mockResolvedValue(portefeuilleData),
      };
      (Portefeuille as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT
      const result = await service.addPraticien({
        visiteur: VISITEUR_ID,
        praticien: PRATICIEN_ID,
      });

      // ASSERT
      expect(result).toBeDefined();
      expect(mockInstance.save).toHaveBeenCalled();
      expect(Portefeuille.findOne).toHaveBeenCalledWith({
        visiteur: VISITEUR_ID,
        praticien: PRATICIEN_ID,
      });
    });

    test('réactive une entrée existante non active', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, { _id: PRATICIEN_ID });

      const existingEntry = {
        actif: false,
        date_ajout: new Date('2023-01-01'),
        save: jest.fn().mockResolvedValue({ ...portefeuilleData, actif: true }),
      };
      (Portefeuille.findOne as jest.Mock).mockResolvedValue(existingEntry);

      // ACT
      const result = await service.addPraticien({
        visiteur: VISITEUR_ID,
        praticien: PRATICIEN_ID,
        notes: 'Notes de suivi',
      });

      // ASSERT
      expect(existingEntry.actif).toBe(true);
      expect(existingEntry.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('lance une erreur si le praticien est déjà actif dans le portefeuille', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, { _id: PRATICIEN_ID });

      (Portefeuille.findOne as jest.Mock).mockResolvedValue({ ...portefeuilleData, actif: true });

      // ACT / ASSERT
      await expect(
        service.addPraticien({ visiteur: VISITEUR_ID, praticien: PRATICIEN_ID })
      ).rejects.toThrow('Ce praticien est déjà dans le portefeuille du visiteur');
    });

    test('lance une erreur si ID visiteur invalide', async () => {
      await expect(
        service.addPraticien({ visiteur: INVALID_ID, praticien: PRATICIEN_ID })
      ).rejects.toThrow('ID visiteur invalide');
    });

    test('lance une erreur si ID praticien invalide', async () => {
      await expect(
        service.addPraticien({ visiteur: VISITEUR_ID, praticien: INVALID_ID })
      ).rejects.toThrow('ID praticien invalide');
    });

    test('lance une erreur si visiteur introuvable', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, null);

      // ACT / ASSERT
      await expect(
        service.addPraticien({ visiteur: VISITEUR_ID, praticien: PRATICIEN_ID })
      ).rejects.toThrow(`Visiteur avec l'ID ${VISITEUR_ID} introuvable`);

      expect(Praticien.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si praticien introuvable', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, null);

      // ACT / ASSERT
      await expect(
        service.addPraticien({ visiteur: VISITEUR_ID, praticien: PRATICIEN_ID })
      ).rejects.toThrow(`Praticien avec l'ID ${PRATICIEN_ID} introuvable`);
    });
  });

  // =========================================================
  describe('removePraticien', () => {
    test('désactive un praticien du portefeuille avec succès', async () => {
      // ARRANGE
      (Portefeuille.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...portefeuilleData,
        actif: false,
      });

      // ACT
      await service.removePraticien(VISITEUR_ID, PRATICIEN_ID);

      // ASSERT
      expect(Portefeuille.findOneAndUpdate).toHaveBeenCalledWith(
        { visiteur: VISITEUR_ID, praticien: PRATICIEN_ID },
        { actif: false },
        { new: true }
      );
    });

    test('lance une erreur si ID visiteur invalide', async () => {
      await expect(service.removePraticien(INVALID_ID, PRATICIEN_ID)).rejects.toThrow(
        'ID visiteur invalide'
      );
    });

    test('lance une erreur si ID praticien invalide', async () => {
      await expect(service.removePraticien(VISITEUR_ID, INVALID_ID)).rejects.toThrow(
        'ID praticien invalide'
      );
    });

    test('lance une erreur si relation introuvable', async () => {
      // ARRANGE
      (Portefeuille.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.removePraticien(VISITEUR_ID, PRATICIEN_ID)).rejects.toThrow(
        'Relation introuvable dans le portefeuille'
      );
    });
  });

  // =========================================================
  describe('getByVisiteur', () => {
    test('retourne le portefeuille actif d\'un visiteur', async () => {
      // ARRANGE
      (Portefeuille.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([portefeuilleData]),
          }),
        }),
      });

      // ACT
      const result = await service.getByVisiteur(VISITEUR_ID);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(Portefeuille.find).toHaveBeenCalledWith({ visiteur: VISITEUR_ID, actif: true });
    });

    test('lance une erreur si ID visiteur invalide', async () => {
      await expect(service.getByVisiteur(INVALID_ID)).rejects.toThrow('ID visiteur invalide');
    });
  });
});
