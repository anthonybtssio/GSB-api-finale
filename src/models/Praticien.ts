import mongoose, { Document, Schema } from 'mongoose';

export interface IPraticien extends Document {
  nom: string;
  prenom: string;
  tel: string;
  email: string;
  rue: string;
  code_postal: string;
  ville: string;
  createdAt: Date;
  updatedAt: Date;
}

const praticienSchema = new Schema<IPraticien>(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true
    },
    tel: {
      type: String,
      required: [true, 'Le téléphone est requis'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide']
    },
    rue: {
      type: String,
      required: [true, 'La rue est requise'],
      trim: true
    },
    code_postal: {
      type: String,
      required: [true, 'Le code postal est requis'],
      trim: true
    },
    ville: {
      type: String,
      required: [true, 'La ville est requise'],
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual pour les visites
praticienSchema.virtual('visites', {
  ref: 'Visite',
  localField: '_id',
  foreignField: 'praticien'
});

// Index (email déjà indexé via unique: true dans le schéma)
praticienSchema.index({ nom: 1, prenom: 1 });
praticienSchema.index({ ville: 1 });

export const Praticien = mongoose.model<IPraticien>('Praticien', praticienSchema);
