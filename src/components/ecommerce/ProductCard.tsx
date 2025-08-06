"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Travail } from "@/types/app.types";
import EtudiantService from "@/api/EtudiantService";
import { parse } from "path";

export default function ProductCard({
    travaux
} : {
    travaux: Travail[];
}) {
  const { isOpen, openModal, closeModal } = useModal();
  const [data, setData] = React.useState<Travail | null>(null);
  const [message, setMessage] = React.useState<string>("");

  const handleSave = (travail: Travail) => {
    // Handle save logic here
    console.log("Saving changes...", travail);
    const token = localStorage.getItem('token')?.toString() || undefined;
    if (!token) {
        setMessage("You must be logged in to save changes.");
        return;
    }

    const etudiantService = new EtudiantService(token);

    const request = etudiantService.createCommande({
        travailId: travail!.id || ""
    })

    request.then((response) => {
        console.log("Commande created successfully:", response);
        const {
            success,
            message
        } = response;

        if (!success) {
            setMessage("Failed to create commande.");
            return;
        }
        console.log('Current montant:', travail.montant);
        const montant = parseFloat(String(travail.montant || 0));
        if (isNaN(montant) || montant <= 0) {
            setMessage("Invalid montant for the travail.");
            return;
        }
        let userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const newSolde = parseFloat(String(userData.solde || 0)) - montant;
        console.log("New solde:", newSolde);
        userData.solde = newSolde;
        console.log("Updated userData:", userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        setMessage(message || "Commande created successfully.");
        return response;
    })
    .catch((error) => {
        console.error("Error creating commande:", error);
        setMessage("Error creating commande.");
        throw error;
    })
    .finally(() => {
        closeModal();
    }); 

  };

  return (
    <>
    {
        travaux ? travaux.map((travail) => {
            if(travail.status !== "pending") return null; // Filter out non-pending travaux
            return (
                <div key={travail.id} className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-3 lg:w-2/3">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                                {travail.theme}
                            </h4>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                                <div>
                                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                        Tritulaire
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                        {travail.titulaire?.nom} {travail.titulaire?.post_nom} {travail.titulaire?.prenom}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                        Date de création
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                        {travail.date_created}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                        Montant
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                        {travail.montant}{" FC"}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                        Consignes
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                        {
                                            travail?.consignes.map((consigne, index) => (
                                                <span key={index} className="block">
                                                    {`${index + 1}. `}{consigne}
                                                </span>
                                            ))
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                        Objectif
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                        {
                                            travail?.description.map((desc, index) => (
                                                <span key={index} className="block">
                                                    {desc}
                                                </span>
                                            ))
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setData(travail);
                                openModal();
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                d="M9 2.25C5.25 2.25 2.25 5.25 2.25 9C2.25 12.75 5.25 15.75 9 15.75C12.75 15.75 15.75 12.75 15.75 9C15.75 5.25 12.75 2.25 9 2.25ZM9 12.75C7.35 12.75 6 11.4 6 9.75C6 8.1 7.35 6.75 9 6.75C10.65 6.75 12 8.1 12 9.75C12 11.4 10.65 12.75 9 12.75Z"
                                fill="currentColor"
                                />
                                <circle cx="9" cy="9" r="2.25" fill="currentColor"/>
                            </svg>
                            En savoir plus
                        </button>
                    </div>
                    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {data ? data.theme : "Travail Details"}
                            </h4>
                            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {
                                data ? data.description.map((desc, index) => (
                                <span key={index} className="block">
                                    {desc}
                                </span>
                                )) : "No description available."
                            }
                            </p>
                        </div>
                        <div className="flex flex-col">
                            <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
                            <div>
                                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                {data ? data.montant : "Montant"} FC
                                </h5>

                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div>
                                    <Label>Consignes</Label>
                                    {
                                        data ? data.consignes.map((consigne, index) => (
                                        <span key={index} className="block">
                                            {consigne}
                                        </span>
                                        )) : "No consignes available."
                                    }
                                </div>

                                <div>
                                    <Label>Note Total</Label>
                                    {
                                        data ? `Max/${data.max_note}` : "S/F"
                                    }
                                </div>
                                </div>
                            </div>
                            </div>
                            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                                <Button size="sm" variant="outline" onClick={closeModal}>
                                    Close
                                </Button>
                                <Button size="sm" onClick={ () => handleSave(data as Travail)}>
                                    Commander
                                </Button>
                                {message && <p className="text-sm text-red-500">{message}</p>}
                            </div>
                        </div>
                        </div>
                    </Modal>
                </div>
            )
        }) : null
      }
    </>
  );
}
