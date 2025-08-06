"use client";

import { useState, useEffect } from "react";
import TitulaireService from "@/api/TitulaireService";

interface Retrait {
  id?: string;
  reference: string;
  amount: number;
  status: string;
  date_created: string;
}

interface UserData {
  nom: string;
  post_nom: string;
  prenom: string;
  matricule: string;
  solde: number;
  retraits?: Retrait[];
}

export default function RetraitPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [retraits, setRetraits] = useState<Retrait[]>([]);
  const [filteredRetraits, setFilteredRetraits] = useState<Retrait[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRetrait, setNewRetrait] = useState({
    reference: "",
    amount: ""
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserType = localStorage.getItem('userType');
      const storedUserData = localStorage.getItem('userData');
      
      setUserType(storedUserType);
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setRetraits(parsedData.retraits || []);
          setFilteredRetraits(parsedData.retraits || []);
        } catch (error) {
          console.error('Erreur parsing userData:', error);
        }
      }
    }
  }, []);

  // Filtrer les retraits selon le terme de recherche
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRetraits(retraits);
    } else {
      const filtered = retraits.filter(retrait =>
        retrait.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        retrait.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        retrait.amount.toString().includes(searchTerm)
      );
      setFilteredRetraits(filtered);
    }
  }, [searchTerm, retraits]);

  const generateReference = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RET-${timestamp}-${random}`;
  };

  const handleCreateRetrait = async () => {
    if (!newRetrait.reference || !newRetrait.amount) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const amount = parseFloat(newRetrait.amount);
    if (amount <= 0) {
      alert("Le montant doit être supérieur à 0");
      return;
    }

    if (amount > (userData?.solde || 0)) {
      alert("Montant supérieur au solde disponible");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const titulaireService = new TitulaireService(token);
      await titulaireService.createRetrait({
        reference: newRetrait.reference,
        amount: amount
      });

      // Créer le nouveau retrait localement
      const nouveauRetrait: Retrait = {
        id: Date.now().toString(),
        reference: newRetrait.reference,
        amount: amount,
        status: "En attente",
        date_created: new Date().toISOString()
      };

      const nouveauxRetraits = [...retraits, nouveauRetrait];
      setRetraits(nouveauxRetraits);

      // Mettre à jour userData dans localStorage
      if (userData) {
        const updatedUserData = {
          ...userData,
          retraits: nouveauxRetraits
        };
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }

      // Réinitialiser le formulaire
      setNewRetrait({ reference: "", amount: "" });
      setShowModal(false);
      alert('Retrait créé avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la création du retrait:', error);
      alert(error.message || 'Erreur lors de la création du retrait');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRetrait = async (retraitId: string, reference: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le retrait ${reference} ?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const titulaireService = new TitulaireService(token);
      await titulaireService.deleteRetrait(retraitId);

      const nouveauxRetraits = retraits.filter(retrait => retrait.id !== retraitId);
      setRetraits(nouveauxRetraits);

      // Mettre à jour userData dans localStorage
      if (userData) {
        const updatedUserData = {
          ...userData,
          retraits: nouveauxRetraits
        };
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }

      alert('Retrait supprimé avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du retrait:', error);
      alert(error.message || 'Erreur lors de la suppression du retrait');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approuvé':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejeté':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            Gestion des Retraits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos demandes de retrait et consultez l'historique
          </p>
        </div>

        {/* Solde et statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-blue-100 mb-2">Solde disponible</h3>
            <p className="text-3xl font-bold">{userData.solde?.toLocaleString() || 0} FC</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-green-100 mb-2">Retraits totaux</h3>
            <p className="text-3xl font-bold">{retraits.length}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-purple-100 mb-2">En attente</h3>
            <p className="text-3xl font-bold">
              {retraits.filter(r => r.status.toLowerCase() === 'en attente').length}
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
                  placeholder="Rechercher par référence, statut ou montant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                setNewRetrait({ reference: generateReference(), amount: "" });
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouveau retrait
            </button>
          </div>
        </div>

        {/* Tableau des retraits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historique des retraits ({filteredRetraits.length})
            </h2>
          </div>

          {filteredRetraits.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucun retrait trouvé'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre premier retrait'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
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
                  {filteredRetraits.map((retrait, index) => (
                    <tr key={retrait.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {retrait.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {retrait.amount.toLocaleString()} FC
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(retrait.status)}`}>
                          {retrait.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(retrait.date_created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRetrait(retrait.id || '', retrait.reference)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal pour nouveau retrait */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nouveau retrait
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={newRetrait.reference}
                    onChange={(e) => setNewRetrait({ ...newRetrait, reference: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Référence du retrait"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Montant (FC)
                  </label>
                  <input
                    type="number"
                    value={newRetrait.amount}
                    onChange={(e) => setNewRetrait({ ...newRetrait, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Montant à retirer"
                    min="1"
                    max={userData.solde || 0}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Solde disponible : {userData.solde?.toLocaleString() || 0} FC
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    ⚠️ Conditions de retrait
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Montant minimum : 100 FC</li>
                    <li>• Traitement sous 24-48h</li>
                    <li>• Frais de traitement : 2%</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateRetrait}
                  disabled={loading || !newRetrait.reference || !newRetrait.amount}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Création...
                    </div>
                  ) : (
                    'Créer le retrait'
                  )}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
