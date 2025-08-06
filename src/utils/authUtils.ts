// Utility function to generate matricule in format {XX}.{YYYY}.{ZZ}
export const generateMatricule = (): string => {
  // XX: Random 2-digit number (10-99)
  const xx = Math.floor(Math.random() * 90) + 10;
  
  // YYYY: Current year
  const yyyy = new Date().getFullYear();
  
  // ZZ: Random 2-digit number (10-99)
  const zz = Math.floor(Math.random() * 90) + 10;
  
  return `${xx}.${yyyy}.${zz}`;
};

// Utility function to generate PDF recap
export const generatePDF = async (userData: any, userType: 'etudiant' | 'titulaire') => {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    console.error('PDF generation is only available on client side');
    return;
  }

  console.log('Generating PDF for:', userData, userType);
  
  try {
    // Import pdfMake dynamiquement côté client uniquement
    const pdfMake = await import('pdfmake/build/pdfmake');
    
    // Configuration simple avec polices par défaut ou sans polices externes
    const pdfMakeInstance = pdfMake.default || pdfMake;
    
    // Alternative simple : utiliser seulement les polices du navigateur
    // Si les polices externes posent problème, on peut les omettre
    try {
      pdfMakeInstance.fonts = {
        Roboto: {
          normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
          bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
          italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
          bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
        }
      };
    } catch (fontError) {
      console.warn('Polices externes non disponibles, utilisation des polices par défaut');
    }

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = currentDate.toLocaleTimeString('fr-FR');

    // Définition du document PDF avec types simplifiés
    const docDefinition: any = {
      content: [
        // En-tête
        {
          text: 'RÉCAPITULATIF D\'INSCRIPTION',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Ligne de séparation
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 2,
              lineColor: '#2563eb'
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Informations personnelles
        {
          text: 'INFORMATIONS PERSONNELLES',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Nom complet:', `${userData.nom} ${userData.post_nom} ${userData.prenom}`],
              ['Sexe:', userData.sexe === 'M' ? 'Masculin' : 'Féminin'],
              ['Type de compte:', userType === 'etudiant' ? 'ÉTUDIANT' : 'TITULAIRE']
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },

        // Informations de connexion
        {
          text: 'INFORMATIONS DE CONNEXION',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Matricule:', { text: userData.matricule, style: 'highlight' }],
              ['Date d\'inscription:', dateStr],
              ['Heure:', timeStr]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },

        // Instructions importantes
        {
          text: 'INSTRUCTIONS IMPORTANTES',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          ul: [
            'Conservez précieusement ce document',
            'Votre MATRICULE est votre identifiant de connexion',
            'Ne partagez jamais vos informations de connexion',
            'En cas de problème, contactez l\'administration'
          ],
          margin: [0, 0, 0, 20]
        },

        // Procédure de connexion
        {
          text: 'PROCÉDURE DE CONNEXION',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          ol: [
            'Accédez à la plateforme',
            'Cliquez sur le bouton de connexion',
            `Sélectionnez "${userType === 'etudiant' ? 'Étudiant' : 'Titulaire'}"`,
            `Saisissez votre matricule : ${userData.matricule}`,
            'Entrez votre mot de passe'
          ],
          margin: [0, 0, 0, 30]
        },

        // Pied de page
        {
          text: 'Bienvenue sur la plateforme !',
          style: 'footer',
          alignment: 'center'
        }
      ],
      
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          color: '#2563eb'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#1f2937',
          decoration: 'underline'
        },
        highlight: {
          fontSize: 12,
          bold: true,
          color: '#2563eb',
          background: '#eff6ff'
        },
        footer: {
          fontSize: 16,
          bold: true,
          color: '#059669',
          italics: true
        }
      },
      
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.3
      },
      
      info: {
        title: `Récapitulatif d'inscription - ${userData.matricule}`,
        author: 'Plateforme d\'inscription',
        subject: 'Récapitulatif d\'inscription',
        creator: 'Système d\'inscription',
        producer: 'pdfmake'
      }
    };

    // Générer et télécharger le PDF
    pdfMakeInstance.createPdf(docDefinition).download(`recapitulatif_inscription_${userData.matricule}.pdf`);
    
    // Message de succès
    setTimeout(() => {
      alert(`PDF généré avec succès !\nFichier: recapitulatif_inscription_${userData.matricule}.pdf`);
    }, 500);
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
  }
};
