"use client";

import { useState, useEffect } from "react";
import TitulaireService from "@/api/TitulaireService";
import EtudiantService from "@/api/EtudiantService";

interface UserData {
  nom: string;
  post_nom: string;
  prenom: string;
  matricule: string;
  sexe: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userType, setUserType] = useState<"etudiant" | "titulaire" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserData = localStorage.getItem('userData');
      const storedUserType = localStorage.getItem('userType') as "etudiant" | "titulaire" | null;
      
      if (storedUserData && storedUserType) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setEditedData(parsedData); // Initialiser les données d'édition
          setUserType(storedUserType);
        } catch (error) {
          console.error('Erreur lors de la lecture des données utilisateur:', error);
        }
      }
    }
  }, []);

  const handleInputChange = (field: keyof UserData, value: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: value
      });
      // Nettoyer l'erreur pour ce champ
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editedData?.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!editedData?.post_nom.trim()) {
      newErrors.post_nom = 'Le post-nom est requis';
    }
    if (!editedData?.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editedData || !userData) return;
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }
      // Identifier les champs modifiés et les mettre à jour un par un
      const fieldsToUpdate: Array<{col: 'nom' | 'prenom' | 'post_nom' | 'sexe', value: string}> = [];
      
      if (editedData.nom !== userData.nom) {
        fieldsToUpdate.push({col: 'nom', value: editedData.nom});
      }
      if (editedData.prenom !== userData.prenom) {
        fieldsToUpdate.push({col: 'prenom', value: editedData.prenom});
      }
      if (editedData.post_nom !== userData.post_nom) {
        fieldsToUpdate.push({col: 'post_nom', value: editedData.post_nom});
      }
      if (editedData.sexe !== userData.sexe) {
        fieldsToUpdate.push({col: 'sexe', value: editedData.sexe});
      }

      // Effectuer les mises à jour
      for (const field of fieldsToUpdate) {
        if (userType == 'titulaire') {

          const titulaireService = new TitulaireService(token);   
          // Pour les titulaires, on utilise le service TitulaireService
          await titulaireService.updateTitulaire(field);
            
        } else {
            const etudiantService = new EtudiantService(token);
            await etudiantService.updateEtudiant(field);
        }
      }
      
      // Mettre à jour les données locales
      setUserData(editedData);
      localStorage.setItem('userData', JSON.stringify(editedData));
      
      setIsEditing(false);
      alert('Informations mises à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(error.message || 'Erreur lors de la sauvegarde des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData(userData); // Réinitialiser aux données originales
    setErrors({});
    setIsEditing(false);
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mon Profil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos informations personnelles
          </p>
        </div>

        {/* Carte principale */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
          {/* En-tête de la carte */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="text-xl font-semibold">
                  {userData.nom} {userData.post_nom} {userData.prenom}
                </h2>
                <p className="text-blue-100 text-sm font-mono">
                  {userData.matricule}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu de la carte */}
          <div className="p-6 space-y-6">
            {/* Formulaire */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom *
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editedData?.nom || ''}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none ${
                          errors.nom 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder="Votre nom"
                      />
                      {errors.nom && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nom}</p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {userData.nom}
                    </p>
                  )}
                </div>

                {/* Post-nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Post-nom *
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editedData?.post_nom || ''}
                        onChange={(e) => handleInputChange('post_nom', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none ${
                          errors.post_nom 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder="Votre post-nom"
                      />
                      {errors.post_nom && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.post_nom}</p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {userData.post_nom}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom *
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editedData?.prenom || ''}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none ${
                          errors.prenom 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder="Votre prénom"
                      />
                      {errors.prenom && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.prenom}</p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {userData.prenom}
                    </p>
                  )}
                </div>

                {/* Sexe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sexe
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData?.sexe || 'M'}
                      onChange={(e) => handleInputChange('sexe', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {userData.sexe === "M" ? "Masculin" : "Féminin"}
                    </p>
                  )}
                </div>
              </div>

              {/* Informations non modifiables */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Informations du compte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Matricule
                    </label>
                    <p className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-mono">
                      {userData.matricule}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Non modifiable
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de compte
                    </label>
                    <p className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white capitalize">
                      {userType}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Non modifiable
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier mes informations
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 inline-block mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Sauvegarder
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Note informative */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Les champs marqués d'un astérisque (*) sont obligatoires
          </p>
        </div>
      </div>
    </div>
  );
}
