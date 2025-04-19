import { useState, useMemo, useEffect } from 'react';
import { Filter, Search, ChevronDown, X, ArrowLeft, Check } from 'lucide-react';
import './App.css';
import SegwiseTable from './components/SegwiseTable';
import logo from './assets/logo.png';
import segwiseReport from './constants/segwiseReport.json';

function App() {
  const initialData = segwiseReport;

  // Parse the data to convert strings to appropriate types
  const [data] = useState(
    initialData.map((item) => ({
      ...item,
      ipm: parseFloat(item.ipm),
      ctr: parseFloat(item.ctr),
      spend: parseFloat(item.spend),
      impressions: parseInt(item.impressions),
      clicks: parseInt(item.clicks),
      cpm: parseFloat(item.cpm),
      cost_per_click: parseFloat(item.cost_per_click),
      cost_per_install: parseFloat(item.cost_per_install),
      installs: parseInt(item.installs),
      // Parse tags into a structured format
      parsedTags: item.tags
        ? item.tags
            .split(';')
            .filter((tag) => tag.trim() !== '')
            .reduce((acc, tag) => {
              const [key, value] = tag.split(':');
              if (key && value) {
                acc[key.trim()] = value.trim();
              }
              return acc;
            }, {})
        : {},
    }))
  );

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [filterComparison, setFilterComparison] = useState('equals'); // 'equals', 'greater', 'less'
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStep, setFilterStep] = useState(1);
  const [valueSearchTerm, setValueSearchTerm] = useState('');

  // Extract dimensions, metrics, and tags dynamically from data
  const dimensions = useMemo(() => {
    return [
      'Campaign',
      'Ad Group',
      'Country',
      'Creative Name',
      'Ad Network',
      'OS',
    ];
  }, []);

  const metrics = useMemo(() => {
    return [
      { name: 'IPM', field: 'ipm', isNumeric: true },
      { name: 'CTR', field: 'ctr', isNumeric: true },
      { name: 'Spend', field: 'spend', isNumeric: true },
      { name: 'Impressions', field: 'impressions', isNumeric: true },
      { name: 'Clicks', field: 'clicks', isNumeric: true },
      { name: 'CPM', field: 'cpm', isNumeric: true },
      { name: 'Cost Per Click', field: 'cost_per_click', isNumeric: true },
      { name: 'Cost Per Install', field: 'cost_per_install', isNumeric: true },
      { name: 'Installs', field: 'installs', isNumeric: true },
    ];
  }, []);

  // Extract all unique tag categories from the data
  const tagCategories = useMemo(() => {
    const allTags = new Set();
    data.forEach((item) => {
      if (item.tags) {
        const tags = item.tags.split(';');
        tags.forEach((tag) => {
          const parts = tag.split(':');
          if (parts.length === 2) {
            allTags.add(parts[0].trim());
          }
        });
      }
    });
    return Array.from(allTags).sort();
  }, [data]);

  // Get filter options based on selected category
  const getFilterOptions = (category) => {
    if (category === 'Campaign') {
      return [...new Set(data.map((item) => item.campaign))]
        .filter(Boolean)
        .sort();
    } else if (category === 'Ad Group') {
      return [...new Set(data.map((item) => item.ad_group))]
        .filter(Boolean)
        .sort();
    } else if (category === 'Country') {
      return [...new Set(data.map((item) => item.country))]
        .filter(Boolean)
        .sort();
    } else if (category === 'Creative Name') {
      return [...new Set(data.map((item) => item.creative_name))]
        .filter(Boolean)
        .sort();
    } else if (category === 'Ad Network') {
      return [...new Set(data.map((item) => item.ad_network))]
        .filter(Boolean)
        .sort();
    } else if (category === 'OS') {
      return [...new Set(data.map((item) => item.os))].filter(Boolean).sort();
    } else if (tagCategories.includes(category)) {
      // Get all unique values for this tag category
      const values = new Set();
      data.forEach((item) => {
        if (item.tags) {
          const tags = item.tags.split(';');
          tags.forEach((tag) => {
            const [key, value] = tag.split(':').map((part) => part.trim());
            if (key === category && value) {
              values.add(value);
            }
          });
        }
      });
      return Array.from(values).sort();
    } else if (metrics.map((m) => m.name).includes(category)) {
      // For metrics, we'll handle this differently in the UI
      return [];
    }
    return [];
  };

  // Get the current selected metric details
  const getSelectedMetric = () => {
    return metrics.find((m) => m.name === filterCategory);
  };

  // Apply filter function
  const applyFilter = () => {
    if (filterCategory) {
      let newFilter;
      const selectedMetric = getSelectedMetric();

      if (selectedMetric?.isNumeric) {
        // For numeric metrics
        if (filterValue !== null && filterValue !== '') {
          newFilter = {
            category: filterCategory,
            value: parseFloat(filterValue),
            comparison: filterComparison,
            field: selectedMetric.field,
          };
        }
      } else {
        // For dimensions and tags
        if (filterValue) {
          newFilter = { category: filterCategory, value: filterValue };
        }
      }

      if (newFilter) {
        setActiveFilters([...activeFilters, newFilter]);
        setFilterStep(1);
        setFilterCategory(null);
        setFilterValue(null);
        setFilterComparison('equals');
        setIsFilterOpen(false);
        setValueSearchTerm('');
      }
    }
  };

  // Remove filter function
  const removeFilter = (indexToRemove) => {
    setActiveFilters(
      activeFilters.filter((_, index) => index !== indexToRemove)
    );
  };

  // Filter data based on active filters and search term
  const filteredData = useMemo(() => {
    if (activeFilters.length === 0 && !searchTerm) {
      return data;
    }

    return data.filter((item) => {
      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = Object.values(item).some(
          (value) =>
            (typeof value === 'string' &&
              value.toLowerCase().includes(searchLower)) ||
            (typeof value === 'number' && String(value).includes(searchLower))
        );

        // Also search within tags
        const tagsMatchSearch =
          item.tags && item.tags.toLowerCase().includes(searchLower);

        if (!matchesSearch && !tagsMatchSearch) {
          return false;
        }
      }

      // Apply active filters
      return activeFilters.every((filter) => {
        const { category, value, comparison, field } = filter;

        // Handle metric filters
        if (field) {
          const itemValue = item[field];
          if (comparison === 'greater') {
            return itemValue > value;
          } else if (comparison === 'less') {
            return itemValue < value;
          } else {
            return itemValue === value;
          }
        }

        // Handle dimension filters
        if (dimensions.includes(category)) {
          const fieldMap = {
            Campaign: 'campaign',
            'Ad Group': 'ad_group',
            Country: 'country',
            'Creative Name': 'creative_name',
            'Ad Network': 'ad_network',
            OS: 'os',
          };

          const field = fieldMap[category];
          return item[field] === value;
        }

        // Handle tag filters
        if (tagCategories.includes(category)) {
          if (!item.tags) return false;

          const tagRegex = new RegExp(`${category}:${value}(;|$)`);
          return tagRegex.test(item.tags);
        }

        return true;
      });
    });
  }, [data, activeFilters, searchTerm, dimensions, tagCategories]);

  // Function to get display text for comparison type
  const getComparisonText = (comparison) => {
    switch (comparison) {
      case 'equals':
        return 'equals';
      case 'greater':
        return 'greater than';
      case 'less':
        return 'less than';
      default:
        return 'equals';
    }
  };

  // Reset filter selection when closing the filter panel
  useEffect(() => {
    if (!isFilterOpen) {
      setFilterStep(1);
      setFilterCategory(null);
      setFilterValue(null);
      setFilterComparison('equals');
      setValueSearchTerm('');
    }
  }, [isFilterOpen]);

  return (
    <div className="min-h-screen p-4">
      <div className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="logo" className="mr-3" />
            <div>
              <h1 className="text-3xl font-medium">Segwise</h1>
              <p className="text-gray-500 text-base">Front End Test</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700"
            >
              <Filter size={16} className="mr-2" />
              Filters
              <ChevronDown size={16} className="ml-2" />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10">
                {filterStep === 1 && (
                  <div className="p-3">
                    <div className="p-2 bg-gray-100 rounded mb-3">
                      <div className="flex items-center">
                        <Search size={16} className="text-gray-500 mr-2" />
                        <input
                          type="text"
                          placeholder="Search filters..."
                          className="w-full bg-transparent outline-none"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex border-b pb-2 mb-3">
                      <button
                        className={`px-3 py-1 ${
                          !filterCategory || filterCategory === 'Dimensions'
                            ? 'border-b-2 border-green-500 text-green-600'
                            : 'text-gray-600'
                        }`}
                        onClick={() => setFilterCategory('Dimensions')}
                      >
                        Dimensions
                      </button>
                      <button
                        className={`px-3 py-1 ${
                          filterCategory === 'Tags'
                            ? 'border-b-2 border-green-500 text-green-600'
                            : 'text-gray-600'
                        }`}
                        onClick={() => setFilterCategory('Tags')}
                      >
                        Tags
                      </button>
                      <button
                        className={`px-3 py-1 ${
                          filterCategory === 'Metrics'
                            ? 'border-b-2 border-green-500 text-green-600'
                            : 'text-gray-600'
                        }`}
                        onClick={() => setFilterCategory('Metrics')}
                      >
                        Metrics
                      </button>
                    </div>

                    <div className="mt-2 max-h-64 overflow-y-auto">
                      {filterCategory === 'Dimensions' &&
                        dimensions.map((item, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                            onClick={() => {
                              setFilterCategory(item);
                              setFilterStep(2);
                            }}
                          >
                            {item}
                          </div>
                        ))}

                      {filterCategory === 'Tags' &&
                        tagCategories.map((item, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                            onClick={() => {
                              setFilterCategory(item);
                              setFilterStep(2);
                            }}
                          >
                            {item}
                          </div>
                        ))}

                      {filterCategory === 'Metrics' &&
                        metrics.map((item, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                            onClick={() => {
                              setFilterCategory(item.name);
                              setFilterStep(2);
                            }}
                          >
                            {item.name}
                          </div>
                        ))}

                      {!filterCategory &&
                        dimensions.map((item, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                            onClick={() => {
                              setFilterCategory(item);
                              setFilterStep(2);
                            }}
                          >
                            {item}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {filterStep === 2 && (
                  <div className="p-3">
                    <div className="flex items-center mb-3">
                      <button
                        onClick={() => setFilterStep(1)}
                        className="text-gray-500 hover:text-gray-700 mr-2"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div className="px-2 py-1 bg-green-100 text-green-800 rounded flex items-center">
                        {filterCategory}
                      </div>
                    </div>

                    {getSelectedMetric()?.isNumeric ? (
                      // Numeric metric filter options
                      <div>
                        <div className="mb-3">
                          <label className="block text-gray-700 text-sm font-medium mb-1">
                            Comparison
                          </label>
                          <div className="flex gap-2">
                            {['equals', 'greater', 'less'].map((comp) => (
                              <button
                                key={comp}
                                onClick={() => setFilterComparison(comp)}
                                className={`px-3 py-1 text-sm rounded-md ${
                                  filterComparison === comp
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {getComparisonText(comp)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-gray-700 text-sm font-medium mb-1">
                            Value
                          </label>
                          <input
                            type="number"
                            value={filterValue || ''}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter value"
                          />
                        </div>
                      </div>
                    ) : (
                      // String-based filter options (dimensions and tags)
                      <div>
                        <div className="mb-3">
                          <div className="p-2 bg-gray-100 rounded">
                            <div className="flex items-center">
                              <Search
                                size={16}
                                className="text-gray-500 mr-2"
                              />
                              <input
                                type="text"
                                placeholder="Search options..."
                                className="w-full bg-transparent outline-none"
                                value={valueSearchTerm}
                                onChange={(e) =>
                                  setValueSearchTerm(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          {getFilterOptions(filterCategory)
                            .filter(
                              (option) =>
                                !valueSearchTerm ||
                                option
                                  .toLowerCase()
                                  .includes(valueSearchTerm.toLowerCase())
                            )
                            .map((option, index) => (
                              <div
                                key={index}
                                className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${
                                  filterValue === option ? 'bg-green-50' : ''
                                }`}
                                onClick={() => setFilterValue(option)}
                              >
                                <div
                                  className={`w-5 h-5 mr-2 flex items-center justify-center rounded border ${
                                    filterValue === option
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {filterValue === option && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                                <span className="truncate" title={option}>
                                  {option}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={applyFilter}
                      disabled={filterValue === null || filterValue === ''}
                      className={`w-full py-2 rounded-md mt-3 ${
                        filterValue === null || filterValue === ''
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 border rounded-md w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="bg-green-100 px-3 py-1 rounded-full flex items-center"
              >
                <span className="mr-1 text-green-800 text-sm">
                  {filter.category}:
                </span>
                <span className="text-green-600 text-sm">
                  {filter.comparison && filter.comparison !== 'equals'
                    ? `${getComparisonText(filter.comparison)} ${filter.value}`
                    : filter.value}
                </span>
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-2 text-green-500 hover:text-green-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={() => setActiveFilters([])}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <SegwiseTable filteredData={filteredData} />
      <div className="text-right text-sm text-gray-500">
        {filteredData.length} of {data.length} items
      </div>
    </div>
  );
}

export default App;
