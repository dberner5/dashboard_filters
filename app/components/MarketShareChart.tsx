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
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const getAISummary = async (chartData: any[]) => {
    setIsSummarizing(true);
    try {
      const dataDescription = chartData.map(series => ({
        category: series.name,
        averageShare: series.avgShare.toFixed(1) + '%'
      }));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chartData: dataDescription }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setSummary(data.summary);
    } catch (error) {
      console.error('Error getting AI summary:', error);
      setSummary('Unable to generate summary at this time.');
    } finally {
      setIsSummarizing(false);
    }
  };

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
    const plotData = Array.from(categories)
      .filter(category => category && !category.startsWith('trace'))
      .map(category => {
        const monthlyShares = Object.keys(monthlyData).sort().map(month => {
          const total = Object.values(monthlyData[month]).reduce((a, b) => a + b, 0);
          return ((monthlyData[month][category] || 0) / total) * 100;
        });
        
        const avgShare = monthlyShares.reduce((a, b) => a + b, 0) / monthlyShares.length;
        
        return {
          x: Object.keys(monthlyData).sort(),
          y: monthlyShares,
          name: category,
          type: 'bar',
          stackgroup: 'one',
          avgShare: avgShare,
        };
      })
      .sort((a, b) => b.avgShare - a.avgShare);

    setData(plotData);
    setIsLoading(false);
    getAISummary(plotData); // Get AI summary whenever data changes
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

      {/* Add AI Summary Section */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">AI Analysis</h4>
        {isSummarizing ? (
          <p className="text-sm text-muted-foreground">Analyzing data...</p>
        ) : (
          <p className="text-sm">{summary}</p>
        )}
      </div>

      <Plot
        data={data.map(trace => ({
          ...trace,
          hovertemplate: '%{y:.1f}% - %{data.name}<extra></extra>',
        }))}
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
          hovermode: 'x unified', // Show all points at the same x-value
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#fff' },
          margin: { t: 50, r: 20, b: 100, l: 70 },
          height: 500,
          hoverlabel: {
            bgcolor: '#1f2937', // Dark background
            bordercolor: '#374151', // Border color
            font: { 
              color: '#ffffff', // White text
              size: 14 
            },
          },
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