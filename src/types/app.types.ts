type Retrait = {
    _id: string;
    reference: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    date_created: string;
}

type Titulaire = {
    _id: string;
    nom: string;
    post_nom: string;
    prenom: string;
    sexe: "M" | "F";
    matricule: string;
    solde?: number;
    password?: string;
    retraits?: Retrait[];
}

type Question = {    
    enonce: string;
    image?: string;
    response: number;
    questions: string[];
    pts: number;
    id?: string;
}

type Travail = {
    id?: string;
    theme: string;
    description: string[];
    consignes: string[];
    date_created: string;
    status: "pending" | "completed" | "failed";
    montant: number;
    max_note: number;
    titulaire: Titulaire;
    questionnaire?: Question[];
}

type Etudiant = {
    id: string;
    nom: string;
    post_nom: string;
    prenom: string;
    matricule: string;
    date_created: string;
    solde?: number;
    recharges?: Recharge[];
}

type Recharge = {
    _id: string;
    reference: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    date_created: string;
    description?: string;
    orderNumber?: string;
}

export type { Retrait, Titulaire, Travail, Etudiant, Recharge };