import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './config/database.js';
import { helmetMiddleware } from './middleware/helmet.middleware.js';
import visiteurRoutes from './routes/visiteur.routes.js';
import praticienRoutes from './routes/praticien.routes.js';
import visiteRoutes from './routes/visite.routes.js';
import motifRoutes from './routes/motif.routes.js';
import portefeuilleRoutes from './routes/portefeuille.routes.js';
import authRoutes from './routes/auth.routes.js';


// Chargement des variables d'environnement
dotenv.config();


/**
 * Gère la configuration et le démarrage du serveur Express
 */
class App {
  public app: express.Application;
  private port: number;
  private database: Database;


  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.database = Database.getInstance();
   
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeDatabase();
  }


  /**
   * Configure les middlewares Express
   */
  private initializeMiddlewares(): void {
    // Fait confiance aux en-têtes X-Forwarded-For envoyés par les proxies (ex: Codespaces, Heroku, Nginx)
    // Nécessaire pour express-rate-limit pour identifier correctement les IPs des clients
    this.app.set('trust proxy', 1);

    // Applique Helmet en premier pour sécuriser les en-têtes HTTP
    this.app.use(helmetMiddleware);

    // Parse le JSON dans les requêtes
    this.app.use(express.json());

    // Parse les données URL-encoded
    this.app.use(express.urlencoded({ extended: true }));

    // Active CORS pour toutes les origines
    this.app.use(cors());
  }


  /**
   * Configure les routes de l'application
   */
  private initializeRoutes(): void {
    // Route de test
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.json({
        message: 'API REST Express.js + TypeScript + MongoDB',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          visiteurs: '/api/visiteurs',
          praticiens: '/api/praticiens',
          visites: '/api/visites',
          motifs: '/api/motifs',
          portefeuille: '/api/portefeuille',
          auth: '/api/auth'
        }
      });
    });


    // Route de santé pour vérifier que l'API fonctionne
    this.app.get('/health', (req: express.Request, res: express.Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Routes API
    this.app.use('/api/visiteurs', visiteurRoutes);
    this.app.use('/api/praticiens', praticienRoutes);
    this.app.use('/api/visites', visiteRoutes);
    this.app.use('/api/motifs', motifRoutes);
    this.app.use('/api/portefeuille', portefeuilleRoutes);
    this.app.use('/api/auth', authRoutes);
  }


  /**
   * Initialise la connexion à la base de données
   */
  private async initializeDatabase(): Promise<void> {
    await this.database.connect();
  }


  /**
   * Démarre le serveur Express
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log('================================');
      console.log(`Serveur démarré sur le port ${this.port}`);
      console.log(`Environnement: ${process.env.NODE_ENV}`);
      console.log('================================');
    });
  }
}


// Création et démarrage de l'application
const app = new App();
app.listen();


process.on('SIGINT', async () => {
  console.log('\n Arrêt du serveur...');
  await Database.getInstance().disconnect();
  process.exit(0);
});
