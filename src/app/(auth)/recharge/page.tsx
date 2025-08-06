"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import EtudiantService from '../../../api/EtudiantService';

interface Recharge {
  _id: string;
  reference: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  date_created: string;
}

interface UserData {
  _id: string;
  nom: string;
  post_nom: string;
  prenom: string;
  matricule: string;
  solde?: number;
  recharges?: Recharge[];
}

export default function RechargePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Données du formulaire de recharge
  const [newRecharge, setNewRecharge] = useState({
    amount: 0,
    currency: 'CDF',
    customer: '',
    description: ''
  });

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('userData');

      if (!token || !user) {
        router.push('/');
        return;
      }

      try {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        router.push('/');
      }
      
      setLoading(false);
    }
  }, [router]);

  const handleCreateRecharge = async () => {
    // Validation des champs
    if (!newRecharge.amount || newRecharge.amount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    if (!newRecharge.customer || !newRecharge.customer.startsWith('243') || newRecharge.customer.length !== 12) {
      alert('Le numéro de téléphone doit commencer par 243 et contenir 12 chiffres au total');
      return;
    }

    if (!newRecharge.description.trim()) {
      alert('Veuillez saisir une description');
      return;
    }

    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const etudiantService = new EtudiantService(token);
      const reference = `RECH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await etudiantService.createPayment({
        reference: `${reference}-${userData!.matricule}`,
        amount: newRecharge.amount,
        currency: newRecharge.currency,
        customer: newRecharge.customer,
        description: newRecharge.description
      });

      if (response.success) {
        // Créer la nouvelle recharge locale
        const newRechargeData: Recharge = {
          _id: response.data._id || Date.now().toString(),
          reference: response.data.reference || reference,
          amount: response.data.amount,
          status: response.data.status || 'pending',
          date_created: new Date(response.data.date_created).toISOString()
        };

        // Mettre à jour userData avec la nouvelle recharge
        const updatedUserData = {
          ...userData!,
          recharges: [newRechargeData, ...(userData!.recharges || [])]
        };
        
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        setShowModal(false);
        setNewRecharge({ amount: 0, currency: 'CDF', customer: '', description: '' });
        
        alert('Recharge créée avec succès ! Référence: ' + reference);
      } else {
        alert('Erreur lors de la création de la recharge: ' + (response.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur lors de la création de la recharge:', error);
      alert('Erreur lors de la création de la recharge');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleValidateRecharge = async (recharge: Recharge) => {
    if (!recharge.reference) {
      alert('Référence manquante');
      return;
    }

    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const etudiantService = new EtudiantService(token);
      const response = await etudiantService.checkPayment({ orderNumber: recharge.reference });

      if (response.success) {
        const {
            solde
        } = response.data;
        // Mettre à jour le statut de la recharge
        const updatedRecharges = (userData!.recharges || []).map(r => 
          r._id === recharge._id 
            ? { ...r, status: 'completed' as const }
            : r
        );

        // Mettre à jour le solde si fourni dans la réponse
        const updatedUserData = {
          ...userData!,
          recharges: updatedRecharges,
          solde: parseFloat(String(solde ?? 0))
        };
        
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        alert('Recharge validée avec succès ! Votre solde a été mis à jour.');
      } else {
        alert('Erreur lors de la validation: ' + (response.message || 'Recharge non trouvée ou déjà validée'));
      }
    } catch (error) {
      console.error('Erreur lors de la validation de la recharge:', error);
      alert('Erreur lors de la validation de la recharge');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'En attente' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Complétée' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Échouée' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const recharges = userData?.recharges || [];
  const filteredRecharges = recharges.filter(recharge =>
    recharge.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recharge.amount.toString().includes(searchTerm)
  );

  if (loading) {
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

  if (!userData) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Recharges
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Rechargez votre solde et suivez l'historique de vos transactions
          </p>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-blue-100 mb-2">Solde actuel</h3>
            <p className="text-3xl font-bold">{userData.solde?.toLocaleString() || 0} FC</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-green-100 mb-2">Recharges totales</h3>
            <p className="text-3xl font-bold">{recharges.length}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-purple-100 mb-2">Recharges validées</h3>
            <p className="text-3xl font-bold">
              {recharges.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium text-orange-100 mb-2">Total rechargé</h3>
            <p className="text-3xl font-bold">
              {recharges
                .filter(r => r.status === 'completed')
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()} FC
            </p>
          </div>
        </div>

        {/* Actions et recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historique des recharges
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher par référence ou montant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                disabled={loadingAction}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouvelle recharge
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des recharges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {filteredRecharges.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucune recharge trouvée'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre première recharge'}
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
                  {filteredRecharges.map((recharge) => (
                    <tr key={recharge._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {recharge.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {recharge.amount.toLocaleString()} FC
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(recharge.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(recharge.date_created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {recharge.status === 'pending' && (
                          <button
                            onClick={() => handleValidateRecharge(recharge)}
                            disabled={loadingAction}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
                          >
                            {loadingAction ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                                Validation...
                              </div>
                            ) : (
                              'Valider'
                            )}
                          </button>
                        )}
                        {recharge.status === 'completed' && (
                          <span className="text-green-600 dark:text-green-400">✓ Validée</span>
                        )}
                        {recharge.status === 'failed' && (
                          <span className="text-red-600 dark:text-red-400">✗ Échouée</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Besoin d'aide ? <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Contactez le support</a>
          </p>
        </div>

        {/* Modal pour nouvelle recharge */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Nouvelle recharge
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
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Montant *
                    </label>
                    <input
                      type="number"
                      value={newRecharge.amount}
                      onChange={(e) => setNewRecharge({ ...newRecharge, amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Devise *
                    </label>
                    <select
                      value={newRecharge.currency}
                      onChange={(e) => setNewRecharge({ ...newRecharge, currency: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="CDF">CDF</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    value={newRecharge.customer}
                    onChange={(e) => setNewRecharge({ ...newRecharge, customer: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="243XXXXXXXXX"
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Le numéro doit commencer par 243 et contenir 12 chiffres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newRecharge.description}
                    onChange={(e) => setNewRecharge({ ...newRecharge, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Description de la recharge"
                    rows={3}
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    💡 Information
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Après création, vous recevrez une référence de paiement. Une fois le paiement effectué, 
                    cliquez sur "Valider" pour créditer votre solde.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateRecharge}
                  disabled={loadingAction || !newRecharge.amount || !newRecharge.customer || !newRecharge.description.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loadingAction ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Création...
                    </div>
                  ) : (
                    'Créer la recharge'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
