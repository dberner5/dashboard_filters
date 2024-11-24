'use client'

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface MarketShareChartProps {
  selectedCategories: any[];
  selectedRetailers: string[];
  selectedBrands: string[];
  selectedAge: string[];
  selectedRegions: string[];
  selectedGenders: string[];
  selectedIncomeBrackets: string[];
}

interface Transaction {
  date: string;
  category_l1: string;
  price: number;
}

const MarketShareChart: React.FC<MarketShareChartProps> = ({
  selectedCategories,
  selectedRetailers,
  selectedBrands,
  selectedAge,
  selectedRegions,
  selectedGenders,
  selectedIncomeBrackets,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryLevel, setCategoryLevel] = useState<'1' | '2' | '3'>('1');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            processData(results.data);
          },
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, [
    selectedCategories, 
    selectedRetailers, 
    selectedBrands, 
    selectedAge,
    selectedRegions,
    selectedGenders,
    selectedIncomeBrackets,
    categoryLevel
  ]);

  const processData = (rawData: any[]) => {
    // Filter data based on selected filters
    let filteredData = rawData;
    
    // Product filters
    if (selectedCategories.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedCategories.some(cat => cat.name === row.category_l1)
      );
    }
    if (selectedRetailers.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedRetailers.includes(row.retailer)
      );
    }
    if (selectedBrands.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedBrands.includes(row.brand)
      );
    }

    // Demographic filters
    if (selectedAge.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedAge.includes(row.age_group)
      );
    }
    if (selectedRegions.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedRegions.includes(row.region)
      );
    }
    if (selectedGenders.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedGenders.includes(row.gender)
      );
    }
    if (selectedIncomeBrackets.length > 0) {
      filteredData = filteredData.filter(row => 
        selectedIncomeBrackets.includes(row.income_bracket)
      );
    }

    // Group by month and selected category level
    const monthlyData: { [key: string]: { [key: string]: number } } = {};
    const categories = new Set<string>();

    filteredData.forEach(row => {
      const date = new Date(row.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = row[`category_l${categoryLevel}`];
      const value = parseFloat(row.price) * parseInt(row.quantity);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      if (!monthlyData[monthKey][category]) {
        monthlyData[monthKey][category] = 0;
      }
      monthlyData[monthKey][category] += value;
      categories.add(category);
    });

    // Convert to Plotly format
    const plotData = Array.from(categories).map(category => ({
      x: Object.keys(monthlyData).sort(),
      y: Object.keys(monthlyData).sort().map(month => {
        const total = Object.values(monthlyData[month]).reduce((a, b) => a + b, 0);
        return ((monthlyData[month][category] || 0) / total) * 100;
      }),
      name: category,
      type: 'bar',
      stackgroup: 'one',
    }));

    setData(plotData);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Market Share Analysis</h3>
        <select
          value={categoryLevel}
          onChange={(e) => setCategoryLevel(e.target.value as '1' | '2' | '3')}
          className="bg-background text-foreground px-3 py-2 rounded-md border border-input"
        >
          <option value="1">Top Level Categories</option>
          <option value="2">Sub-Categories</option>
          <option value="3">Detailed Categories</option>
        </select>
      </div>

      <Plot
        data={data}
        layout={{
          title: `Market Share by ${
            categoryLevel === '1' ? 'Top Level Categories' :
            categoryLevel === '2' ? 'Sub-Categories' :
            'Detailed Categories'
          } Over Time`,
          barmode: 'stack',
          xaxis: { 
            title: 'Month',
            tickangle: -45,
          },
          yaxis: { 
            title: 'Market Share (%)', 
            range: [0, 100],
            tickformat: '.1f',
          },
          showlegend: true,
          legend: { 
            orientation: 'h', 
            y: -0.2,
            xanchor: 'center',
            x: 0.5,
          },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#fff' },
          margin: { t: 50, r: 20, b: 100, l: 70 },
          height: 500,
        }}
        style={{ width: '100%' }}
        config={{ 
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
        }}
      />
    </div>
  );
};

export default MarketShareChart; 