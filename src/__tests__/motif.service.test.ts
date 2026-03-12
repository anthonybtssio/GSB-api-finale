// jest.mock() doit être placé AVANT les imports (cf. document section 5.6.2)
jest.mock('../models/Motif', () => ({
  Motif: Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }),
}));

import { MotifService } from '../services/motif.service';
import { Motif } from '../models/Motif';

const VALID_ID = '507f1f77bcf86cd799439011';
const INVALID_ID = 'invalid-id';

describe('MotifService', () => {
  let service: MotifService;

  beforeEach(() => {
    service = new MotifService();
    jest.clearAllMocks();
  });

  // =========================================================
  describe('create', () => {
    test('crée un motif avec succès', async () => {
      // ARRANGE
      const motifData = { libelle: 'Visite de contrôle' };
      const expectedMotif = { _id: VALID_ID, ...motifData };
      const mockInstance = {
        save: jest.fn().mockResolvedValue(expectedMotif),
      };
      (Motif as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT
      const result = await service.create(motifData);

      // ASSERT
      expect(result).toBeDefined();
      expect(mockInstance.save).toHaveBeenCalled();
    });

    test('propage une erreur si save() échoue (ValidationError)', async () => {
      // ARRANGE
      const validationError = Object.assign(new Error('Validation failed'), {
        name: 'ValidationError',
        errors: { libelle: { message: 'Le libellé du motif est requis' } },
      });
      const mockInstance = {
        save: jest.fn().mockRejectedValue(validationError),
      };
      (Motif as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT / ASSERT
      await expect(service.create({ libelle: '' })).rejects.toThrow();
    });
  });

  // =========================================================
  describe('getAll', () => {
    test('retourne la liste des motifs triée par libellé', async () => {
      // ARRANGE
      const motifs = [
        { _id: VALID_ID, libelle: 'Contrôle' },
        { _id: '507f1f77bcf86cd799439012', libelle: 'Urgence' },
      ];
      (Motif.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(motifs),
      });

      // ACT
      const result = await service.getAll();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(Motif.find).toHaveBeenCalled();
    });

    test('retourne un tableau vide si aucun motif', async () => {
      // ARRANGE
      (Motif.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      // ACT
      const result = await service.getAll();

      // ASSERT
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================
  describe('getById', () => {
    test('retourne un motif existant', async () => {
      // ARRANGE
      const motifData = { _id: VALID_ID, libelle: 'Contrôle' };
      (Motif.findById as jest.Mock).mockResolvedValue(motifData);

      // ACT
      const result = await service.getById(VALID_ID);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.libelle).toBe('Contrôle');
      expect(Motif.findById).toHaveBeenCalledWith(VALID_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      // ARRANGE / ACT / ASSERT
      await expect(service.getById(INVALID_ID)).rejects.toThrow('ID motif invalide');
      expect(Motif.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si motif introuvable', async () => {
      // ARRANGE
      (Motif.findById as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.getById(VALID_ID)).rejects.toThrow(
        `Motif avec l'ID ${VALID_ID} introuvable`
      );
    });
  });

  // =========================================================
  describe('update', () => {
    test('met à jour un motif avec succès', async () => {
      // ARRANGE
      const updatedData = { libelle: 'Nouveau libellé' };
      const updatedMotif = { _id: VALID_ID, ...updatedData };
      (Motif.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedMotif);

      // ACT
      const result = await service.update(VALID_ID, updatedData);

      // ASSERT
      expect(result.libelle).toBe('Nouveau libellé');
      expect(Motif.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        updatedData,
        { new: true, runValidators: true }
      );
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.update(INVALID_ID, {})).rejects.toThrow('ID motif invalide');
    });

    test('lance une erreur si motif introuvable', async () => {
      // ARRANGE
      (Motif.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.update(VALID_ID, {})).rejects.toThrow(
        `Motif avec l'ID ${VALID_ID} introuvable`
      );
    });
  });

  // =========================================================
  describe('delete', () => {
    test('supprime un motif avec succès', async () => {
      // ARRANGE
      (Motif.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: VALID_ID });

      // ACT
      await service.delete(VALID_ID);

      // ASSERT
      expect(Motif.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.delete(INVALID_ID)).rejects.toThrow('ID motif invalide');
    });

    test('lance une erreur si motif introuvable', async () => {
      // ARRANGE
      (Motif.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.delete(VALID_ID)).rejects.toThrow(
        `Motif avec l'ID ${VALID_ID} introuvable`
      );
    });
  });
});
