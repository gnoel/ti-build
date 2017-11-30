# Ti-Build

## Appcelerator Titanium compiler « Ti-Build » (development compilation only)
##### Supports iOS projects on Mac OS

---------

## Compilateur Appcelerator Titanium « Ti-Build » (Compilation en mode développement uniquement)
##### Support des projets iOS sur Mac OS

#### Présentation
Quels sont les avantages à l’utiliser ?
- Utilisation aisée de l’éditeur de son choix (lancement de la compilation par raccourcis clavier)
- Un bouton permet d’ouvrir directement le dossier contenant les bases de données du simulateur ou de copier le chemin dans le presse papier
- Compilation plus rapide (compilation directe par Titanium)
- Pas besoin de compte Appcelerator
- De la couleur dans la console (ça sert à rien mais j’ai trouvé ça joli)

Merci à Thomas Auger et Maxime Girou pour leurs contributions au projet
Maxime : Amélioration de la configuration
Thomas : Packaging de l’application + Création du super Nono logo

### Utilisation

#### Installation

Titanium CLI est requis et doit être à jour
```js
sudo npm install titanium -g
```

Télécharger la dernier version de l'application et l'installer
https://github.com/gnoel/ti-build/releases


#### Première utilisation
Au premier lancement, un message d’erreur sauvage apparaît « Le workspace n’existe pas »
- Fermer ce message d’erreur
- Cliquer sur « Configuration » et paramétrer au minimum :
	- Workspace	: le chemin du workspace contenant vos projets « Appcelerator »
	- Username	: le nom de votre dossier utilisateur
- Fermer la fenêtre
- Relancer « Ti-Build »


#### Comment l'utiliser ?

- Sélectionner le projet (la branche GIT s’affiche entre crochet)
- Sélectionner le device ou simulateur
- Possibilité de sélectionner le provisionning profile et le certificats (requis pour compiler sur un véritable device)
- 
- [Run]     Lancer la compilation (Raccourcis : Touche F5 depuis n’importe où)
- [Refresh] Rafraichir les combo box (Utile notamment pour rafraîchir le nom des branches GIT et la liste des devices)
- [Configuration] Paramétrage de l’application
- [Stop] Arrêter la compilation en cours
- [Open DB] Ouvrir le dossier contenant les bases de données du simulateur sélectionné + copie du chemin dans le presse papier
- [Clear console] Vider la console
- [Adresse IP] Adresse IP du Mac
- 
- L’écran « noir » c’est la console

------
### Développement

#### Exécuter le programme
Cloner le repo
```js
cd ti-build
npm start
```

#### Packager le programme
```js
cd ti-build
npm run dist
```
