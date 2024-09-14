import  { useEffect, useState, useRef } from "react";

import { DataTable } from 'primereact/datatable';

import { Column } from 'primereact/column'
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
// import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber'; 
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './index.css'; 

// Define the structure of the artwork data and API response
interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const App= () => {
  const [allData, setAllData] = useState<Artwork[]>([]);  
  const [page, setPage] = useState<number>(1); // Current page state
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null); // Store pagination info
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]); // For selected rows
  const [rowCount, setRowCount] = useState<number>(0); // State for number of rows to select
  const [loading, setLoading] = useState<boolean>(false); // State for loading indicator

  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
        const jsonData: ApiResponse = await response.json();

        console.log(`Fetching data for page ${page}`);

        setAllData((prevData) => {
          const alreadyFetchedIds = new Set(prevData.map((item) => item.id));
          const newData = jsonData.data.filter((item) => !alreadyFetchedIds.has(item.id));

          return [...prevData, ...newData];
        });

        setPagination(jsonData.pagination);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  console.log(allData)
 

  // Function to fetch enough data to meet the row count requirement
  const fetchDataUntilCount = async (requiredRowCount: number) => {
    let currentPage = page;
    let fetchedData = allData;

    while (fetchedData.length < requiredRowCount) {
      if (pagination && pagination.current_page < pagination.total_pages) {
        currentPage += 1;
        setPage(currentPage);

        try {
          const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentPage}`);
          const jsonData: ApiResponse = await response.json();
          const newData = jsonData.data;

          fetchedData = [...fetchedData, ...newData];
          setAllData(fetchedData);
          setPagination(jsonData.pagination);

        } catch (error) {
          console.error("Error fetching data: ", error);
        }
        
      } else {
        break;
      }
    }

    return fetchedData;
  };

  // Apply the selection of a specific number of rows
  const applyRowSelection = async () => {
    if (rowCount > allData.length) {
      setLoading(true);

      const dataToSelect = await fetchDataUntilCount(rowCount);

      setSelectedArtworks(dataToSelect.slice(0, rowCount)); 
      setLoading(false);
    } else {
      const rowsToSelect = allData.slice(0, rowCount); // Select the first N rows
      setSelectedArtworks(rowsToSelect); // Set the selected rows
    }

    op.current?.hide(); 
  };

  const handleNextPageFetch = async () => {
    if (pagination && pagination.current_page < pagination.total_pages) {
      setPage((prevPage) => prevPage + 1);
      setLoading(true);

      // Fetch data for the next page
      try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page + 1}`);
        const jsonData: ApiResponse = await response.json();
        const newData = jsonData.data;

        setAllData((prevData) => {
          const alreadyFetchedIds = new Set(prevData.map((item) => item.id));
          const filteredData = newData.filter((item) => !alreadyFetchedIds.has(item.id));

          return [...prevData, ...filteredData];
        });

        setPagination(jsonData.pagination);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching next page data: ", error);
        setLoading(false);
      }
    }
  };
// console.log(pagination)
  return (
    <div className="container mx-auto p-4">
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 bg-white">
        {/* DataTable with a checkbox and OverlayPanel icon next to it */}
        <DataTable
          value={allData}
          paginator
          rows={10}
          selection={selectedArtworks}
          onSelectionChange={(e) => setSelectedArtworks(e.value)}
          selectionMode="multiple"
          dataKey="id"
          className="min-w-full"
          rowClassName={() => 'border-b border-gray-200'}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3em' }} header={
            <>
              {/* <Checkbox inputId="header-checkbox" /> */}
              {/* Icon Button for OverlayPanel to control row selection */}
              <Button
                icon="pi pi-angle-down"
                className="ml-2 p-button-rounded p-button-text"
                onClick={(e) => op.current?.toggle(e)}
              />
            </>
          } />

       
          <Column field="title" header="Title" sortable></Column>
          <Column field="place_of_origin" header="Place of Origin" sortable></Column>
          <Column field="artist_display" header="Artist" sortable></Column>
          <Column field="inscriptions" header="Inscriptions" sortable></Column>
          <Column field="date_start" header="Date Start" sortable></Column>
          <Column field="date_end" header="Date End" sortable></Column>
        </DataTable>

      
        <OverlayPanel ref={op} showCloseIcon>
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2">Select Rows</h3>
            <InputNumber
              value={rowCount}
              onValueChange={(e) => setRowCount(e.value || 0)}
              showButtons
              min={0}
              max={pagination ? pagination.total : 0}
              placeholder="Enter number of rows"
              className="w-full mb-4"
            />
            <Button
              label="Apply"
              // icon="pi"
              onClick={applyRowSelection}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={loading}
            />
          </div>
        </OverlayPanel>
      </div>

      {pagination && pagination.current_page < pagination.total_pages && !loading && (
        <div className="flex justify-between mt-4">
          <button
            onClick={handleNextPageFetch}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Fetch Next Page
          </button>

         
        </div>
      )}
    </div>
  );
};

export default App;
