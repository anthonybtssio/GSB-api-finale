jest.mock('../models/Praticien', () => ({
  Praticien: Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }),
}));

import { PraticienService } from '../services/praticien.service';
import { Praticien } from '../models/Praticien';

const VALID_ID = '507f1f77bcf86cd799439011';
const INVALID_ID = 'invalid-id';

const praticienData = {
  _id: VALID_ID,
  nom: 'Martin',
  prenom: 'Jean',
  tel: '0612345678',
  email: 'jean.martin@test.com',
  rue: '10 rue de la Paix',
  code_postal: '75001',
  ville: 'Paris',
};

describe('PraticienService', () => {
  let service: PraticienService;

  beforeEach(() => {
    service = new PraticienService();
    jest.clearAllMocks();
  });

  // =========================================================
  describe('create', () => {
    test('crée un praticien avec succès', async () => {
      // ARRANGE
      const mockInstance = {
        save: jest.fn().mockResolvedValue(praticienData),
      };
      (Praticien as unknown as jest.Mock).mockImplementation(() => mockInstance);

      // ACT
      const result = await service.create(praticienData);

      // ASSERT
      expect(result).toBeDefined();
      expect(mockInstance.save).toHaveBeenCalled();
    });
  });

  // =========================================================
  describe('getAll', () => {
    test('retourne tous les praticiens sans filtre', async () => {
      // ARRANGE
      (Praticien.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([praticienData]),
      });

      // ACT
      const result = await service.getAll();

      // ASSERT
      expect(result).toHaveLength(1);
      expect(Praticien.find).toHaveBeenCalledWith({});
    });

    test('filtre les praticiens par ville', async () => {
      // ARRANGE
      (Praticien.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([praticienData]),
      });

      // ACT
      const result = await service.getAll({ ville: 'Paris' });

      // ASSERT
      expect(result).toHaveLength(1);
      expect(Praticien.find).toHaveBeenCalledWith(
        expect.objectContaining({ ville: expect.any(RegExp) })
      );
    });

    test('filtre les praticiens par nom', async () => {
      // ARRANGE
      (Praticien.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([praticienData]),
      });

      // ACT
      await service.getAll({ nom: 'Martin' });

      // ASSERT
      expect(Praticien.find).toHaveBeenCalledWith(
        expect.objectContaining({ nom: expect.any(RegExp) })
      );
    });
  });

  // =========================================================
  describe('getById', () => {
    test('retourne un praticien existant', async () => {
      // ARRANGE
      (Praticien.findById as jest.Mock).mockResolvedValue(praticienData);

      // ACT
      const result = await service.getById(VALID_ID);

      // ASSERT
      expect(result.email).toBe('jean.martin@test.com');
      expect(Praticien.findById).toHaveBeenCalledWith(VALID_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.getById(INVALID_ID)).rejects.toThrow('ID praticien invalide');
      expect(Praticien.findById).not.toHaveBeenCalled();
    });

    test('lance une erreur si praticien introuvable', async () => {
      // ARRANGE
      (Praticien.findById as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.getById(VALID_ID)).rejects.toThrow(
        `Praticien avec l'ID ${VALID_ID} introuvable`
      );
    });
  });

  // =========================================================
  describe('getByEmail', () => {
    test('retourne un praticien si email trouvé', async () => {
      // ARRANGE
      (Praticien.findOne as jest.Mock).mockResolvedValue(praticienData);

      // ACT
      const result = await service.getByEmail('jean.martin@test.com');

      // ASSERT
      expect(result).toBeDefined();
      expect(Praticien.findOne).toHaveBeenCalledWith({ email: 'jean.martin@test.com' });
    });

    test('retourne null si email non trouvé', async () => {
      // ARRANGE
      (Praticien.findOne as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await service.getByEmail('inconnu@test.com');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  // =========================================================
  describe('update', () => {
    test('met à jour un praticien avec succès', async () => {
      // ARRANGE
      const updatedData = { ville: 'Lyon' };
      const updatedPraticien = { ...praticienData, ...updatedData };
      (Praticien.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedPraticien);

      // ACT
      const result = await service.update(VALID_ID, updatedData);

      // ASSERT
      expect(result.ville).toBe('Lyon');
      expect(Praticien.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        updatedData,
        { new: true, runValidators: true }
      );
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.update(INVALID_ID, {})).rejects.toThrow('ID praticien invalide');
    });

    test('lance une erreur si praticien introuvable', async () => {
      // ARRANGE
      (Praticien.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.update(VALID_ID, {})).rejects.toThrow(
        `Praticien avec l'ID ${VALID_ID} introuvable`
      );
    });
  });

  // =========================================================
  describe('delete', () => {
    test('supprime un praticien avec succès', async () => {
      // ARRANGE
      (Praticien.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: VALID_ID });

      // ACT
      await service.delete(VALID_ID);

      // ASSERT
      expect(Praticien.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    test('lance une erreur si ID invalide', async () => {
      await expect(service.delete(INVALID_ID)).rejects.toThrow('ID praticien invalide');
    });

    test('lance une erreur si praticien introuvable', async () => {
      // ARRANGE
      (Praticien.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // ACT / ASSERT
      await expect(service.delete(VALID_ID)).rejects.toThrow(
        `Praticien avec l'ID ${VALID_ID} introuvable`
      );
    });
  });
});
