"use client";
import React, { useEffect, useState } from 'react'
import FilterProducts from './FilterProducts'
import ProductCard from './ProductCard'
import AppService from '@/api/AppService';
import { Travail } from '@/types/app.types';


export default function ProductsCard() {
  const [data, setData] = useState< Travail[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterData, setFilterData] = useState<Travail[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Function to handle search input change
  const handleSearchInputChange = (term: string) => {
    setSearchTerm(term);
    handleFilterChange();
  };

  const handleFilterChange = () => {
    // Implement filter logic here
    if (searchTerm) {
      const filtered = data?.filter((travail) => {
        let items = null;
        items = travail.theme.toLowerCase().includes(searchTerm.toLowerCase());
        if(!items){
            items = travail.titulaire.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }

        return items;
      });
      setFilterData(filtered || []);
    } else {
      setFilterData(data || []);
    }
  }

  useEffect(() => {
    // Fetch data or perform side effects here
    const fetchData = async () => {
        // Initialize AppService inside useEffect to avoid SSR issues
        const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.toString() : undefined;
        const appService = new AppService(token);
        
        const request = await appService.fetchTravaux();
        console.log("Fetched travaux:", request);
        setData(request);
    }
    fetchData();
  }, [loading]);

    useEffect(() => {
        if (loading && data) {
            setLoading(false);
            
        }
    }, [data]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
    
  }

  return (
    <div className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
            <FilterProducts 
            travaux={data || []}
            onSearchChange={handleSearchInputChange}
            />
            <ProductCard
            travaux={filterData.length > 0 ? filterData : data || []}
            />
        </div>
    </div>
  )
}
