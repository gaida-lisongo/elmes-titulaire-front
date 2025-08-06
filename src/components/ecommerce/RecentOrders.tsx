"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import EtudiantService from "@/api/EtudiantService";
import { Travail } from "@/types/app.types";
import Button from "../ui/button/Button";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";

// Define the TypeScript interface for the table rows
interface CommandeItem {
  _id: string;
  createdAt: string;
  etudiantId: string;
  date_created: string;
  observations: string[];
  travailId: string;
}

type CommandeData = {
  commande: CommandeItem;
  travail: Travail & { max_note: number }; // Include max_note in Travail type
};

export default function RecentOrders() {
  const [data, setData] = React.useState<CommandeData[] | []>([]);
  const [filteredData, setFilteredData] = useState<CommandeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCommande, setSelectedCommande] = useState<CommandeData | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const token = localStorage.getItem('token')?.toString();
  const etudiantService = new EtudiantService(token);

  const showTravailDetails = (commandeData: CommandeData) => {
    console.log("Show details for travail ID:", commandeData.commande.travailId);
    setSelectedCommande(commandeData);
    openModal();
  }

  const downloadQuestionnaire = (commandeData: CommandeData) => {
    console.log("Downloading questionnaire for:", commandeData.travail.theme);
    
    etudiantService.getTravailById(commandeData.commande._id)
      .then(response => {
        console.log("Questionnaire downloaded successfully:", response);
      })
      .catch(error => {
        console.error("Error downloading questionnaire:", error);
      });
  }

  // Filter and search functionality
  useEffect(() => {
    let filtered = data;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.travail.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.travail.description.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status (you can add status field to your data if needed)
    if (statusFilter !== "all") {
      // For now, we'll use a placeholder status based on date
      // You can modify this based on your actual status field
      filtered = filtered.filter(item => {
        const status = getCommandeStatus(item);
        return status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter]);

  const getCommandeStatus = (item: CommandeData) => {
    // Placeholder logic - replace with actual status from your data
    const createdDate = new Date(item.commande.date_created);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff < 1) return "Pending";
    if (daysDiff < 7) return "In Progress";
    return "Completed";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "success";
      case "in progress": return "warning";
      case "pending": return "info";
      default: return "secondary";
    }
  };

  useEffect(() => {
    const fetchLastCommandes = async () => {
      try {
        const {
          success,
          message,
          data
        } = await etudiantService.fetchCommandes();
        if (success) {
          let commandes: CommandeData[] = [];

          data.forEach((item: any) => {
            const {
              travail,
              commande
            } = item;
            
            commandes.push({
              commande: {
                _id: commande._id,
                createdAt: commande.createdAt,
                etudiantId: commande.etudiantId,
                date_created: commande.date_created,
                observations: commande.observations,
                travailId: commande.travailId
              },
              travail: {
                ...travail,
                max_note: travail.max || 0 // Ensure max is defined
              }
            });
          })
          console.log("Fetched commandes:", commandes);


          setData(commandes);
        } else {
          console.error("Failed to fetch commandes:", message);
        }
        // You can process the commandes data here if needed
      } catch (error) {
        console.error("Error fetching commandes:", error);
      }
    };

    fetchLastCommandes();
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      {/* Header with Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Mes Commandes
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez et suivez vos commandes de travaux
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {filteredData.length} commande{filteredData.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par thème ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Commands Cards Grid */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucune commande trouvée
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all" 
                ? "Essayez de modifier vos critères de recherche."
                : "Vous n'avez pas encore passé de commandes."
              }
            </p>
          </div>
        ) : (
          filteredData.map((item) => {
            const status = getCommandeStatus(item);
            return (
              <div
                key={item.commande._id}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left Content */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.travail.theme}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Commande #{item.commande._id.slice(-8)}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        color={getStatusColor(status) as any}
                      >
                        {status}
                      </Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Actions
                        </p>
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => downloadQuestionnaire(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Questionnaire
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Date de commande
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(item.commande.date_created).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Montant
                        </p>
                        <p className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">
                          {item.travail.montant} FC
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Note maximale
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {item.travail.max_note} points
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Observations du titulaire
                        </p>
                        {item.commande.observations && item.commande.observations.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {item.commande.observations.slice(0, 2).map((obs, index) => (
                              <p key={index} className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                                • {obs}
                              </p>
                            ))}
                            {item.commande.observations.length > 2 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                +{item.commande.observations.length - 2} autre{item.commande.observations.length - 2 > 1 ? 's' : ''} observation{item.commande.observations.length - 2 > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                            Aucune observation pour le moment
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showTravailDetails(item)}
                      className="w-full lg:w-auto"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Voir détails
                    </Button>
                  </div>
                </div>

                {/* Progress indicator for visual appeal */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100 dark:bg-gray-700">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      status === "Completed" ? "w-full bg-green-500" :
                      status === "In Progress" ? "w-2/3 bg-yellow-500" :
                      "w-1/3 bg-blue-500"
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-4xl">
        {selectedCommande && (
          <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCommande.travail.theme}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Commande #{selectedCommande.commande._id}
                </p>
              </div>
              <Badge
                size="sm"
                color={getStatusColor(getCommandeStatus(selectedCommande)) as any}
              >
                {getCommandeStatus(selectedCommande)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                    Informations générales
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Montant:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {selectedCommande.travail.montant} FC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Note maximale:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedCommande.travail.max_note} points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Date de commande:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedCommande.commande.date_created).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                    Actions disponibles
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => downloadQuestionnaire(selectedCommande)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger le questionnaire complet
                    </button>
                    
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Titulaire responsable
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedCommande.travail.titulaire?.nom} {selectedCommande.travail.titulaire?.post_nom} {selectedCommande.travail.titulaire?.prenom}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                    Description
                  </h3>
                  <div className="space-y-2">
                    {selectedCommande.travail.description.map((desc, index) => (
                      <p key={index} className="text-gray-700 dark:text-gray-300">
                        {desc}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                    Consignes
                  </h3>
                  <div className="space-y-2">
                    {selectedCommande.travail.consignes.map((consigne, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300">
                          {consigne}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCommande.commande.observations && selectedCommande.commande.observations.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                      Observations du titulaire
                    </h3>
                    <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="space-y-2">
                        {selectedCommande.commande.observations.map((obs, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            <p className="text-gray-700 dark:text-gray-300">
                              {obs}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(!selectedCommande.commande.observations || selectedCommande.commande.observations.length === 0) && (
                  <div>
                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                      Observations du titulaire
                    </h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-center text-gray-500 dark:text-gray-400 italic">
                        Aucune observation disponible pour le moment
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={closeModal} variant="outline">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
