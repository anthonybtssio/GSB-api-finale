import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IVisiteur extends Document {
  nom: string;
  prenom: string;
  tel: string;
  email: string;
  password: string;
  date_embauche: Date;
  portefeuillePraticiens: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const visiteurSchema = new Schema<IVisiteur>(
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
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères']
    },
    date_embauche: {
      type: Date,
      required: [true, 'La date d\'embauche est requise']
    },
    portefeuillePraticiens: {
      type: [Schema.Types.ObjectId],
      ref: 'Praticien',
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Hash du mot de passe avant sauvegarde
visiteurSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Méthode de comparaison du mot de passe
visiteurSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual pour les visites
visiteurSchema.virtual('visites', {
  ref: 'Visite',
  localField: '_id',
  foreignField: 'visiteur'
});

// Index (email déjà indexé via unique: true dans le schéma)
visiteurSchema.index({ nom: 1, prenom: 1 });

export const Visiteur = mongoose.model<IVisiteur>('Visiteur', visiteurSchema);
