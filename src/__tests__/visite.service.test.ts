jest.mock('../models/Visite', () => ({
  Visite: Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
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

jest.mock('../models/Motif', () => ({
  Motif: Object.assign(jest.fn(), {
    findById: jest.fn(),
  }),
}));

import { VisiteService } from '../services/visite.service';
import { Visite } from '../models/Visite';
import { Visiteur } from '../models/Visiteur';
import { Praticien } from '../models/Praticien';
import { Motif } from '../models/Motif';

const VISITE_ID   = '507f1f77bcf86cd799439011';
const VISITEUR_ID = '507f1f77bcf86cd799439022';
const PRATICIEN_ID = '507f1f77bcf86cd799439033';
const MOTIF_ID    = '507f1f77bcf86cd799439044';
const INVALID_ID  = 'invalid-id';

const visiteData = {
  _id: VISITE_ID,
  date_visite: new Date('2024-01-15'),
  commentaire: 'RAS',
  visiteur: VISITEUR_ID,
  praticien: PRATICIEN_ID,
  motif: MOTIF_ID,
};

/** Mock chaîné : Visiteur/Praticien/Motif.findById().select('_id').lean() */
function mockFindByIdSelectLean(mockFn: jest.Mock, returnValue: object | null) {
  mockFn.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(returnValue),
    }),
  });
}

describe('VisiteService', () => {
  let service: VisiteService;

  beforeEach(() => {
    service = new VisiteService();
    jest.clearAllMocks();
  });

  // =========================================================
  describe('create', () => {
    test('crée une visite avec succès', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, { _id: PRATICIEN_ID });
      mockFindByIdSelectLean(Motif.findById as jest.Mock, { _id: MOTIF_ID });

      const mockInstance = {
        save: jest.fn().mockResolvedValue(visiteData),
      };
      (Visite as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT
      const result = await service.create({
        date_visite: new Date('2024-01-15'),
        visiteur: VISITEUR_ID,
        praticien: PRATICIEN_ID,
        motif: MOTIF_ID,
      });

      // ASSERT
      expect(result).toBeDefined();
      expect(mockInstance.save).toHaveBeenCalled();
    });

    test('lance une erreur si ID visiteur invalide', async () => {
      await expect(
        service.create({ date_visite: new Date(), visiteur: INVALID_ID, praticien: PRATICIEN_ID, motif: MOTIF_ID })
      ).rejects.toThrow('ID visiteur invalide');
    });

    test('lance une erreur si ID praticien invalide', async () => {
      await expect(
        service.create({ date_visite: new Date(), visiteur: VISITEUR_ID, praticien: INVALID_ID, motif: MOTIF_ID })
      ).rejects.toThrow('ID praticien invalide');
    });

    test('lance une erreur si ID motif invalide', async () => {
      await expect(
        service.create({ date_visite: new Date(), visiteur: VISITEUR_ID, praticien: PRATICIEN_ID, motif: INVALID_ID })
      ).rejects.toThrow('ID motif invalide');
    });

    test('lance une erreur si visiteur introuvable', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, null);

      // ACT / ASSERT
      await expect(
        service.create({ date_visite: new Date(), visiteur: VISITEUR_ID, praticien: PRATICIEN_ID, motif: MOTIF_ID })
      ).rejects.toThrow(`Visiteur avec l'ID ${VISITEUR_ID} introuvable`);

      expect(Praticien.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si praticien introuvable', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, null);

      // ACT / ASSERT
      await expect(
        service.create({ date_visite: new Date(), visiteur: VISITEUR_ID, praticien: PRATICIEN_ID, motif: MOTIF_ID })
      ).rejects.toThrow(`Praticien avec l'ID ${PRATICIEN_ID} introuvable`);

      expect(Motif.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si motif introuvable', async () => {
      // ARRANGE
      mockFindByIdSelectLean(Visiteur.findById as jest.Mock, { _id: VISITEUR_ID });
      mockFindByIdSelectLean(Praticien.findById as jest.Mock, { _id: PRATICIEN_ID });
      mockFindByIdSelectLean(Motif.findById as jest.Mock, null);

      // ACT / ASSERT
      await expect(
        service.create({ date_visite: new Date(), visiteur: VISITEUR_ID, praticien: PRATICIEN_ID, motif: MOTIF_ID })
      ).rejects.toThrow(`Motif avec l'ID ${MOTIF_ID} introuvable`);
    });
  });

  // =========================================================
  describe('getById', () => {
    test('retourne une visite existante', async () => {
      // ARRANGE
      (Visite.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(visiteData),
          }),
        }),
      });

      // ACT
      const result = await service.getById(VISITE_ID);

      // ASSERT
      expect(result).toBeDefined();
      expect(Visite.findById).toHaveBeenCalledWith(VISITE_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.getById(INVALID_ID)).rejects.toThrow('ID visite invalide');
      expect(Visite.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si visite introuvable', async () => {
      // ARRANGE
      (Visite.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      // ACT / ASSERT
      await expect(service.getById(VISITE_ID)).rejects.toThrow(
        `Visite avec l'ID ${VISITE_ID} introuvable`
      );
    });
  });

  // =========================================================
  describe('getByVisiteur', () => {
    test('retourne les visites d\'un visiteur', async () => {
      // ARRANGE
      (Visite.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([visiteData]),
          }),
        }),
      });

      // ACT
      const result = await service.getByVisiteur(VISITEUR_ID);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(Visite.find).toHaveBeenCalledWith({ visiteur: VISITEUR_ID });
    });

    test('lance une erreur si ID visiteur invalide', async () => {
      await expect(service.getByVisiteur(INVALID_ID)).rejects.toThrow('ID visiteur invalide');
    });
  });

  // =========================================================
  describe('delete', () => {
    test('supprime une visite avec succès', async () => {
      // ARRANGE
      (Visite.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: VISITE_ID });

      // ACT
      await service.delete(VISITE_ID);

      // ASSERT
      expect(Visite.findByIdAndDelete).toHaveBeenCalledWith(VISITE_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.delete(INVALID_ID)).rejects.toThrow('ID visite invalide');
    });

    test('lance une erreur si visite introuvable', async () => {
      // ARRANGE
      (Visite.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.delete(VISITE_ID)).rejects.toThrow(
        `Visite avec l'ID ${VISITE_ID} introuvable`
      );
    });
  });
});
