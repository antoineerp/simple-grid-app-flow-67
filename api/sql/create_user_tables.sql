
-- Requête SQL pour créer les tables d'un utilisateur (à remplacer USER_ID par l'identifiant technique)

-- Table des documents
CREATE TABLE IF NOT EXISTS documents_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    responsabilite_r TEXT,
    responsabilite_a TEXT,
    responsabilite_c TEXT,
    responsabilite_i TEXT,
    atteinte ENUM('NC', 'PC', 'C') DEFAULT NULL,
    exclusion BOOLEAN DEFAULT FALSE,
    ordre INT DEFAULT 0,
    groupId VARCHAR(36) DEFAULT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des groupes de documents
CREATE TABLE IF NOT EXISTS document_groupes_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    ordre INT DEFAULT 0,
    est_deploye BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des exigences
CREATE TABLE IF NOT EXISTS exigences_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    critere VARCHAR(50) NOT NULL,
    indicateur VARCHAR(50) NOT NULL,
    exigence TEXT NOT NULL,
    responsable VARCHAR(255),
    atteinte ENUM('NC', 'PC', 'C') DEFAULT NULL,
    exclusion BOOLEAN DEFAULT FALSE,
    commentaire TEXT,
    ordre INT DEFAULT 0,
    groupId VARCHAR(36) DEFAULT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des collaborateurs
CREATE TABLE IF NOT EXISTS collaborateurs_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    poste VARCHAR(100),
    role VARCHAR(50),
    competences TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de la bibliothèque
CREATE TABLE IF NOT EXISTS bibliotheque_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100),
    type_document VARCHAR(50),
    url VARCHAR(255),
    fichier_chemin VARCHAR(255),
    fichier_nom VARCHAR(255),
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de collaboration
CREATE TABLE IF NOT EXISTS collaboration_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    statut ENUM('En cours', 'Terminé', 'En attente') DEFAULT 'En cours',
    priorite ENUM('Basse', 'Normale', 'Haute', 'Critique') DEFAULT 'Normale',
    date_debut TIMESTAMP NULL,
    date_fin TIMESTAMP NULL,
    responsable VARCHAR(255),
    participants TEXT,
    groupId VARCHAR(36) DEFAULT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des groupes de collaboration
CREATE TABLE IF NOT EXISTS collaboration_groups_USER_ID (
    id VARCHAR(36) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    ordre INT DEFAULT 0,
    est_deploye BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
