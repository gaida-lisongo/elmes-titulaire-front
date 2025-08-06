"use client";

import { useState, useEffect } from "react";
import TitulaireService from "@/api/TitulaireService";
import { stat } from "fs";

interface Questionnaire {
  enonce: string;
  image?: string;
  response: number;
  questions: string[]; // Propositions de réponses QCM
  pts: number;
  id?: string;
}

interface Commande {
  _id: string;
  etudiant: {
    nom: string;
    post_nom: string;
    prenom: string;
    matricule: string;
    _id: string;
    sexe: string;
  };
  date_created: string;
  travailId: string;
  note?: string;
  observations?: string[];
  descriptions?: string[];
}

interface Travail {
  id?: string;
  theme: string;
  description: string[];
  consignes: string[];
  montant: number;
  max: number;
  questionnaire?: Questionnaire[];
  date_created?: string;
  status?: string;
}

interface UserData {
  nom: string;
  post_nom: string;
  prenom: string;
  matricule: string;
  travaux?: Travail[];
}

export default function TravauxPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [travaux, setTravaux] = useState<Travail[]>([]);
  const [filteredTravaux, setFilteredTravaux] = useState<Travail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'info' | 'questionnaires'>('info');
  const [modalMessage, setModalMessage] = useState<string>('');
  // États pour l'action de modification (stylo)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTravail, setEditingTravail] = useState<Travail | null>(null);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);
  
  // États pour l'action de visualisation des commandes (œil)
  const [showCommandesModal, setShowCommandesModal] = useState(false);
  const [selectedTravail, setSelectedTravail] = useState<Travail | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loadingCommandes, setLoadingCommandes] = useState(false);
  const [noteInputs, setNoteInputs] = useState<{[key: string]: number}>({});
  const [commentaireInputs, setCommentaireInputs] = useState<{[key: string]: string}>({});
  const [savingNotes, setSavingNotes] = useState(false);
  const [commandeSearchTerm, setCommandeSearchTerm] = useState('');
    // Fonctions pour gérer les propositions QCM
  const updateProposition = (index: number, value: string) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions[index] = value;
    setNewQuestionnaire({ ...newQuestionnaire, questions: updatedQuestions });
  };

  const addProposition = () => {
    if (newQuestionnaire.questions.length < 6) { // Maximum 6 propositions
      setNewQuestionnaire({
        ...newQuestionnaire,
        questions: [...newQuestionnaire.questions, ""]
      });
    }
  };

  const removeProposition = (index: number) => {
    if (newQuestionnaire.questions.length > 2) { // Minimum 2 propositions
      const updatedQuestions = newQuestionnaire.questions.filter((_, i) => i !== index);
      setNewQuestionnaire({
        ...newQuestionnaire,
        questions: updatedQuestions,
        response: newQuestionnaire.response > updatedQuestions.length ? 1 : newQuestionnaire.response
      });
    }
  };

  // Fonctions pour gérer les descriptions
  const [newTravail, setNewTravail] = useState<Travail>({
    theme: "",
    description: [""],
    consignes: [""],
    montant: 0,
    max: 0,
    questionnaire: []
  });
  
  // État pour nouveau questionnaire
  const [newQuestionnaire, setNewQuestionnaire] = useState<Questionnaire>({
    enonce: "",
    image: "",
    response: 1,
    questions: ["", "", "", ""], // 4 propositions par défaut
    pts: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserType = localStorage.getItem('userType');
      const storedUserData = localStorage.getItem('userData');
      
      setUserType(storedUserType);
      if (storedUserData) {
        try {
            console.log('Parsing userData from localStorage:', storedUserData);     
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          const titulaireApi = new TitulaireService(localStorage.getItem('token') ?? undefined);
          const travauxData = titulaireApi.fetchTravaux();
            travauxData.then(travauxData => {
                const data = travauxData.data;

                let items : Travail[] = [];

                if(travauxData.success) {
                    data.forEach((travail: any) => {
                        console.log("Travail fetched:", travail);
                        items.push({
                            id: travail._id,
                            theme: travail.theme,
                            description: travail.description,
                            consignes: travail.consignes,
                            montant: travail.montant,
                            max: travail.max,
                            questionnaire: travail.questionnaire,
                            status: travail.status,
                            date_created: travail.createdAt
                        });
                    });
                }

                console.log("Travaux fetched:", items);
                setTravaux(items);
                setFilteredTravaux(items);
            }).catch(error => {
                console.error('Erreur lors de la récupération des travaux:', error);
            })
        } catch (error) {
          console.error('Erreur parsing userData:', error);
        }
      }
    }
  }, []);

  // Filtrer les travaux selon le terme de recherche
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTravaux(travaux);
    } else {
      const filtered = travaux.filter(travail =>
        travail.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        travail.description.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        travail.montant.toString().includes(searchTerm)
      );
      setFilteredTravaux(filtered);
    }
  }, [searchTerm, travaux]);

  // Gestion des champs de description
  const addDescriptionField = () => {
    setNewTravail({
      ...newTravail,
      description: [...newTravail.description, ""]
    });
  };

  const updateDescriptionField = (index: number, value: string) => {
    const newDescription = [...newTravail.description];
    newDescription[index] = value;
    setNewTravail({
      ...newTravail,
      description: newDescription
    });
  };

  const removeDescriptionField = (index: number) => {
    if (newTravail.description.length > 1) {
      const newDescription = newTravail.description.filter((_, i) => i !== index);
      setNewTravail({
        ...newTravail,
        description: newDescription
      });
    }
  };

  // Gestion des champs de consignes
  const addConsigneField = () => {
    setNewTravail({
      ...newTravail,
      consignes: [...newTravail.consignes, ""]
    });
  };

  const updateConsigneField = (index: number, value: string) => {
    const newConsignes = [...newTravail.consignes];
    newConsignes[index] = value;
    setNewTravail({
      ...newTravail,
      consignes: newConsignes
    });
  };

  const removeConsigneField = (index: number) => {
    if (newTravail.consignes.length > 1) {
      const newConsignes = newTravail.consignes.filter((_, i) => i !== index);
      setNewTravail({
        ...newTravail,
        consignes: newConsignes
      });
    }
  };

  // Gestion des questionnaires
  const addQuestionnaire = () => {
    // Validation de base
    if (!newQuestionnaire.enonce.trim()) {
      alert('Veuillez saisir l\'énoncé de la question.');
      return;
    }

    // Vérifier que toutes les propositions sont remplies
    const propositionsValides = newQuestionnaire.questions.filter(q => q.trim() !== "");
    if (propositionsValides.length < 2) {
      alert('Veuillez saisir au moins 2 propositions de réponses.');
      return;
    }

    // Vérifier que la réponse correcte correspond à une proposition existante
    if (newQuestionnaire.response > propositionsValides.length || newQuestionnaire.response < 1) {
      alert('La réponse correcte doit correspondre à une des propositions saisies.');
      return;
    }

    if (newQuestionnaire.pts <= 0) {
      alert('Veuillez saisir un nombre de points valide (supérieur à 0).');
      return;
    }

    // Vérifier la limite de points
    const totalPtsActuel = newTravail.questionnaire?.reduce((sum, q) => sum + q.pts, 0) || 0;
    if (totalPtsActuel + newQuestionnaire.pts > newTravail.max) {
      alert(`La note totale ne peut pas dépasser ${newTravail.max} points. Points disponibles: ${newTravail.max - totalPtsActuel}`);
      return;
    }

    // Créer le questionnaire avec seulement les propositions valides
    const questionnaireToAdd = {
      ...newQuestionnaire,
      questions: propositionsValides
    };

    setNewTravail({
      ...newTravail,
      questionnaire: [...(newTravail.questionnaire || []), questionnaireToAdd]
    });

    // Réinitialiser le formulaire
    setNewQuestionnaire({
      enonce: "",
      image: "",
      response: 1,
      questions: ["", "", "", ""], // 4 propositions par défaut
      pts: 0
    });
  };

  const removeQuestionnaire = (index: number) => {
    const newQuestionnaires = newTravail.questionnaire?.filter((_, i) => i !== index) || [];
    setNewTravail({
      ...newTravail,
      questionnaire: newQuestionnaires
    });
  };

  const validateStep1 = () => {
    if (!newTravail.theme || !newTravail.montant || !newTravail.max) {
      alert("Veuillez remplir tous les champs obligatoires");
      return false;
    }
    if (newTravail.description.some(desc => !desc.trim())) {
      alert("Veuillez remplir toutes les descriptions");
      return false;
    }
    if (newTravail.consignes.some(cons => !cons.trim())) {
      alert("Veuillez remplir toutes les consignes");
      return false;
    }
    return true;
  };

  const handleCreateTravail = async () => {
    const totalPts = newTravail.questionnaire?.reduce((sum, q) => sum + q.pts, 0) || 0;
    
    if (totalPts !== newTravail.max) {
      alert(`La somme des points des questionnaires (${totalPts}) doit être égale au maximum défini (${newTravail.max})`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const titulaireService = new TitulaireService(token);
      await titulaireService.createTravail({
        theme: newTravail.theme,
        description: newTravail.description.filter(desc => desc.trim()),
        consignes: newTravail.consignes.filter(cons => cons.trim()),
        montant: newTravail.montant,
        max: newTravail.max,
        questionnaire: newTravail.questionnaire
      });

      // Créer le nouveau travail localement
      const nouveauTravail: Travail = {
        ...newTravail,
        id: Date.now().toString(),
        date_created: new Date().toISOString(),
        status: "Actif"
      };

      const nouveauxTravaux = [...travaux, nouveauTravail];
      setTravaux(nouveauxTravaux);

      // Mettre à jour userData dans localStorage
      if (userData) {
        const updatedUserData = {
          ...userData,
          travaux: nouveauxTravaux
        };
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }

      // Réinitialiser le formulaire
      setNewTravail({
        theme: "",
        description: [""],
        consignes: [""],
        montant: 0,
        max: 0,
        questionnaire: []
      });
      setModalStep('info');
      setShowModal(false);
      alert('Travail créé avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la création du travail:', error);
      alert(error.message || 'Erreur lors de la création du travail');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTravail = async (travailId: string, theme: string) => {
    console.log(`Tentative de suppression du travail ${travailId} - ${theme}`); 
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le travail "${theme}" ?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const titulaireService = new TitulaireService(token);
      await titulaireService.deleteTravail(travailId);

      const nouveauxTravaux = travaux.filter(travail => travail.id !== travailId);
      setTravaux(nouveauxTravaux);

      // Mettre à jour userData dans localStorage
      if (userData) {
        const updatedUserData = {
          ...userData,
          travaux: nouveauxTravaux
        };
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }

      alert('Travail supprimé avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du travail:', error);
      alert(error.message || 'Erreur lors de la suppression du travail');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ouvrir la modal de modification (stylo)
  const handleEditTravail = (travail: Travail) => {
    console.log("Travail à modifier:", travail);
    setEditingTravail(travail);
    setEditField('');
    setEditValue('');
    setShowEditModal(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingTravail || !editField || !editValue.trim()) {
      alert('Veuillez sélectionner un champ et saisir une valeur');
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const titulaireService = new TitulaireService(token);
      let valueToSend: string | number | string[] = editValue;

      // Conversion selon le type de champ
      if (editField === 'montant' || editField === 'max') {
        valueToSend = parseInt(editValue);
      } else if (editField === 'description' || editField === 'consignes') {
        valueToSend = [editValue];
      }

      await titulaireService.updateTravail({
        id: editingTravail.id!,
        col: editField as 'theme' | 'description' | 'consignes' | 'montant' | 'max',
        value: valueToSend
      });

      // Mettre à jour localement
      const updatedTravaux = travaux.map(travail => {
        if (travail.id === editingTravail.id) {
          return {
            ...travail,
            [editField]: valueToSend
          };
        }
        return travail;
      });
      setTravaux(updatedTravaux);

      alert('Travail modifié avec succès !');
      setShowEditModal(false);
      setEditingTravail(null);
    } catch (error: any) {
      console.error('Erreur lors de la modification du travail:', error);
      alert(error.message || 'Erreur lors de la modification du travail');
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour visualiser les commandes (œil)
  const handleViewCommandes = async (travail: Travail) => {
    setSelectedTravail(travail);
    setLoadingCommandes(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const titulaireService = new TitulaireService(token);
      const response = await titulaireService.fetchTravail(travail.id!);
      console.log("Detail d'un travail", response);
      if (response.success && response.data) {
        response.data.forEach((commande: any) => {
          const commandeData = {
            _id: commande._id,
            etudiant: commande.etudiantId,
            date_created: commande.date_created,
            travailId: commande.travailId,
            note: commande.observations[0],
            descriptions: commande.descriptions
          };
          setCommandes(prev => [...prev, commandeData]);
          setNoteInputs(prev => ({
            ...prev,
            [commande._id]: commande.observations[0]
          }));
          setCommentaireInputs(prev => ({
            ...prev,
            [commande._id]: commande.descriptions
          }));
        });
      } else {
        setCommandes([]);
      }
      setShowCommandesModal(true);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des commandes:', error);
      alert(error.message || 'Erreur lors de la récupération des commandes');
      setCommandes([]);
    } finally {
      setLoadingCommandes(false);
    }
  };

  // Fonction pour fermer la modal des commandes
  const handleCloseCommandesModal = () => {
    setShowCommandesModal(false);
    setSelectedTravail(null);
    setCommandes([]);
    setNoteInputs({});
    setCommentaireInputs({});
    setCommandeSearchTerm('');
  };

  const handleExportCSV = () => {
    if (!selectedTravail || commandes.length === 0) return;

    const csvData = commandes.map(commande => ({
      'Nom': commande.etudiant.nom,
      'Post-nom': commande.etudiant.post_nom,
      'Prénom': commande.etudiant.prenom,
      'Matricule': commande.etudiant.matricule,
      'Thème': selectedTravail.theme,
      'Note': noteInputs[commande._id] || 0,
      'Note maximale': selectedTravail.max,
      'Date': commande.date_created ? formatDate(commande.date_created) : 'N/A'
    } as { [key: string]: string | number }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `evaluations_${selectedTravail.theme.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCommandes = commandes.filter(commande => {
    if (!commandeSearchTerm) return true;
    const searchLower = commandeSearchTerm.toLowerCase();
    return (
      commande.etudiant.nom.toLowerCase().includes(searchLower) ||
      commande.etudiant.post_nom.toLowerCase().includes(searchLower) ||
      commande.etudiant.prenom.toLowerCase().includes(searchLower) ||
      commande.etudiant.matricule.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalPointsUsed = () => {
    return newTravail.questionnaire?.reduce((sum, q) => sum + q.pts, 0) || 0;
  };

  // Redirection si pas titulaire
  if (userType && userType !== 'titulaire') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              Accès non autorisé
            </h1>
            <p className="text-red-700 dark:text-red-300">
              Cette page est réservée aux utilisateurs de type "titulaire". 
              Votre type de compte actuel est : <span className="font-medium capitalize">{userType}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Travaux
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Créez et gérez vos travaux avec questionnaires
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-purple-100 mb-2">Travaux totaux</h3>
            <p className="text-3xl font-bold">{travaux.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-green-100 mb-2">Travaux actifs</h3>
            <p className="text-3xl font-bold">
              {travaux.filter(t => t.status !== 'Fermé').length}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-blue-100 mb-2">Total questionnaires</h3>
            <p className="text-3xl font-bold">
              {travaux.reduce((sum, t) => sum + (t.questionnaire?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Actions et recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par thème, description ou montant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                setNewTravail({
                  theme: "",
                  description: [""],
                  consignes: [""],
                  montant: 0,
                  max: 0,
                  questionnaire: []
                });
                setModalStep('info');
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouveau travail
            </button>
          </div>
        </div>

        {/* Tableau des travaux */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Liste des travaux ({filteredTravaux.length})
            </h2>
          </div>

          {filteredTravaux.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucun travail trouvé'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre premier travail'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thème
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Note Max
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTravaux.map((travail, index) => (
                    <tr key={travail.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {travail.theme}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {travail.description[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {travail.montant.toLocaleString()} FC
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {travail.max} pts
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {travail.questionnaire?.length || 0} question(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {travail.date_created ? formatDate(travail.date_created) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Bouton modifier (stylo) */}
                          <button
                            onClick={() => handleEditTravail(travail)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                            title="Modifier le travail"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Bouton visualiser (œil) */}
                          <button
                            onClick={() => handleViewCommandes(travail)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
                            title="Voir les commandes"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {/* Bouton supprimer */}
                          <button
                            onClick={() => handleDeleteTravail(travail.id || '', travail.theme)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                            title="Supprimer le travail"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal pour nouveau travail */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {modalStep === 'info' ? 'Nouveau travail - Étape 1/2' : 'Nouveau travail - Étape 2/2'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {modalStep === 'info' ? 'Informations générales du travail' : 'Gestion des questionnaires'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Indicateur d'étapes */}
                <div className="flex items-center mt-4">
                  <div className={`flex items-center ${modalStep === 'info' ? 'text-purple-600' : 'text-green-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      modalStep === 'info' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {modalStep === 'info' ? '1' : '✓'}
                    </div>
                    <span className="ml-2 text-sm font-medium">Informations</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600 mx-4"></div>
                  <div className={`flex items-center ${modalStep === 'questionnaires' ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      modalStep === 'questionnaires' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                    }`}>
                      2
                    </div>
                    <span className="ml-2 text-sm font-medium">Questionnaires</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {modalStep === 'info' ? (
                  // Étape 1 : Informations du travail
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Thème *
                        </label>
                        <input
                          type="text"
                          value={newTravail.theme}
                          onChange={(e) => setNewTravail({ ...newTravail, theme: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Thème du travail"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Montant (FC) *
                          </label>
                          <input
                            type="number"
                            value={newTravail.montant}
                            onChange={(e) => setNewTravail({ ...newTravail, montant: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Note Max *
                          </label>
                          <input
                            type="number"
                            value={newTravail.max}
                            onChange={(e) => setNewTravail({ ...newTravail, max: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descriptions *
                        </label>
                        <button
                          onClick={addDescriptionField}
                          type="button"
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          + Ajouter une description
                        </button>
                      </div>
                      <div className="space-y-3">
                        {newTravail.description.map((desc, index) => (
                          <div key={index} className="flex gap-2">
                            <textarea
                              value={desc}
                              onChange={(e) => updateDescriptionField(index, e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder={`Description ${index + 1}`}
                              rows={2}
                            />
                            {newTravail.description.length > 1 && (
                              <button
                                onClick={() => removeDescriptionField(index)}
                                type="button"
                                className="text-red-600 hover:text-red-700 p-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Consignes */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Consignes *
                        </label>
                        <button
                          onClick={addConsigneField}
                          type="button"
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          + Ajouter une consigne
                        </button>
                      </div>
                      <div className="space-y-3">
                        {newTravail.consignes.map((consigne, index) => (
                          <div key={index} className="flex gap-2">
                            <textarea
                              value={consigne}
                              onChange={(e) => updateConsigneField(index, e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder={`Consigne ${index + 1}`}
                              rows={2}
                            />
                            {newTravail.consignes.length > 1 && (
                              <button
                                onClick={() => removeConsigneField(index)}
                                type="button"
                                className="text-red-600 hover:text-red-700 p-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          if (validateStep1()) {
                            setModalStep('questionnaires');
                          }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                ) : (
                  // Étape 2 : Questionnaires
                  <div className="space-y-6">
                    {/* Résumé des points */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                        📊 Répartition des points
                      </h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700 dark:text-purple-300">
                          Points utilisés : {getTotalPointsUsed()}/{newTravail.max}
                        </span>
                        <span className="text-purple-700 dark:text-purple-300">
                          Points restants : {newTravail.max - getTotalPointsUsed()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(getTotalPointsUsed() / newTravail.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Formulaire d'ajout de questionnaire */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Ajouter un questionnaire
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Énoncé *
                          </label>
                          <textarea
                            value={newQuestionnaire.enonce}
                            onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, enonce: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Énoncé de la question"
                            rows={3}
                          />
                        </div>

                        {/* Propositions QCM */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Propositions de réponses QCM *
                            </label>
                            <button
                              onClick={addProposition}
                              type="button"
                              disabled={newQuestionnaire.questions.length >= 6}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              + Ajouter une proposition
                            </button>
                          </div>
                          <div className="space-y-3">
                            {newQuestionnaire.questions.map((proposition, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                                  {index + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={proposition}
                                  onChange={(e) => updateProposition(index, e.target.value)}
                                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder={`Proposition ${index + 1}`}
                                />
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name="correct-answer"
                                    checked={newQuestionnaire.response === index + 1}
                                    onChange={() => setNewQuestionnaire({ ...newQuestionnaire, response: index + 1 })}
                                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                                  />
                                  <label className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    Correcte
                                  </label>
                                </div>
                                {newQuestionnaire.questions.length > 2 && (
                                  <button
                                    onClick={() => removeProposition(index)}
                                    type="button"
                                    className="text-red-600 hover:text-red-700 p-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            💡 Cliquez sur le bouton radio pour indiquer la réponse correcte
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Image (URL)
                            </label>
                            <input
                              type="url"
                              value={newQuestionnaire.image}
                              onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, image: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="https://..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Points *
                            </label>
                            <input
                              type="number"
                              value={newQuestionnaire.pts}
                              onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, pts: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="0"
                              min="1"
                              max={newTravail.max - getTotalPointsUsed()}
                            />
                          </div>
                        </div>

                        <button
                          onClick={addQuestionnaire}
                          type="button"
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Ajouter le questionnaire
                        </button>
                      </div>
                    </div>

                    {/* Liste des questionnaires ajoutés */}
                    {newTravail.questionnaire && newTravail.questionnaire.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Questionnaires ajoutés ({newTravail.questionnaire.length})
                        </h4>
                        <div className="space-y-3">
                          {newTravail.questionnaire.map((q, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Question {index + 1} ({q.pts} pts)
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {q.enonce}
                                  </p>
                                  
                                  {/* Affichage des propositions QCM */}
                                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-2">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Propositions :
                                    </p>
                                    <div className="space-y-1">
                                      {q.questions?.map((proposition, propIndex) => (
                                        <div key={propIndex} className="flex items-center text-xs">
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mr-2 ${
                                            propIndex + 1 === q.response 
                                              ? 'bg-green-500' 
                                              : 'bg-gray-400'
                                          }`}>
                                            {propIndex + 1}
                                          </span>
                                          <span className={propIndex + 1 === q.response ? 'font-medium text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                            {proposition}
                                          </span>
                                          {propIndex + 1 === q.response && (
                                            <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Réponse correcte: Proposition {q.response}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeQuestionnaire(index)}
                                  className="text-red-600 hover:text-red-700 ml-4"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setModalStep('info')}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Précédent
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowModal(false)}
                          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleCreateTravail}
                          disabled={loading || getTotalPointsUsed() !== newTravail.max}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Création...
                            </div>
                          ) : (
                            'Créer le travail'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de modification de travail */}
        {showEditModal && editingTravail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Modifier le travail
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Travail : {editingTravail.theme}
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Champ à modifier
                    </label>
                    <select
                      value={editField}
                      onChange={(e) => setEditField(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un champ</option>
                      <option value="theme">Thème</option>
                      <option value="description">Description</option>
                      <option value="consignes">Consignes</option>
                      <option value="montant">Montant</option>
                      <option value="max">Note maximale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nouvelle valeur
                    </label>
                    {editField === 'description' || editField === 'consignes' ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={`Nouvelle ${editField}`}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={editField === 'montant' || editField === 'max' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={`Nouveau ${editField}`}
                        min={editField === 'montant' || editField === 'max' ? '0' : undefined}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading || !editField || !editValue.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {editLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </div>
                    ) : (
                      'Sauvegarder'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de visualisation des commandes */}
        {showCommandesModal && selectedTravail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Commandes du travail : {selectedTravail.theme}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Visualisez et évaluez les commandes des étudiants
                    </p>
                  </div>
                  <button
                    onClick={handleCloseCommandesModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loadingCommandes ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement des commandes...</span>
                  </div>
                ) : commandes.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Aucune commande trouvée
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun étudiant n'a encore commandé ce travail
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Barre d'outils avec recherche et export */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div className="flex-1 max-w-md">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Rechercher un étudiant..."
                            value={commandeSearchTerm}
                            onChange={(e) => setCommandeSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        onClick={handleExportCSV}
                        disabled={commandes.length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exporter CSV
                      </button>
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Total commandes
                        </h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {filteredCommandes.length}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                          Moyenne des notes
                        </h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(() => {
                            const notes = Object.values(noteInputs).filter(note => note > 0);
                            return notes.length > 0 
                              ? (notes.reduce((sum, note) => sum + note, 0) / notes.length).toFixed(1)
                              : '0.0';
                          })()}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                          Commandes notées
                        </h4>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {Object.values(noteInputs).filter(note => note > 0).length}
                        </p>
                      </div>
                    </div>

                    {/* Tableau des commandes */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Étudiant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Matricule
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Note
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredCommandes.map((commande) => (
                            <tr key={commande._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        {commande.etudiant.nom.charAt(0)}{commande.etudiant.prenom.charAt(0)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {commande.etudiant.nom} {commande.etudiant.post_nom} {commande.etudiant.prenom}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {commande.etudiant.matricule}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {commande.date_created ? formatDate(commande.date_created) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedTravail.max}
                                  value={noteInputs[commande._id] || ''}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                      console.error('Token manquant');
                                      return;
                                    }
                                    const titulaireService = new TitulaireService(token as string);
                                    titulaireService.updateCommande({
                                      id: commande._id,
                                      col: 'observations',
                                      value: [value.toString()]
                                    })
                                    .then((res) => {
                                      const {
                                        success,
                                        message,
                                        data
                                      } = res;
                                      if (success) {
                                        setNoteInputs({
                                          ...noteInputs,
                                          [commande._id]: value
                                        });
                                        setModalMessage(message);
                                        //update the commande in the list
                                        const updatedCommandes = commandes.map((c) => c._id === commande._id ? { ...c, observations: [value.toString()], note: value.toString() } : c);
                                        setCommandes(updatedCommandes);
                                      } else {
                                        setModalMessage(message);
                                      }
                                    })
                                    .catch((err) => {
                                      console.log("Erreur lors de la mise à jour : ", err);
                                    });
                                  }}
                                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                  / {selectedTravail.max}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    // Ouvrir une modal pour ajouter des observations
                                    // TODO: Implémenter la modal d'observations
                                  }}
                                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>


                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
