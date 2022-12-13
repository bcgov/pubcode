BCGov public code asset tracking.

TODO
1. UI
  1.1 for searching the assets under bcgov repositories which has bcgovpubcode.yml
  1.2 functionality to creatre an yaml file from the gui based on schema
2. Elastic Search backend API
  2.1 Expose the API to the crawler for data insertiong
  2.2 Expose the API to the UI for data search.
3. Crawler 
  3.1. Crawl through repositories under BCGov, find bcgovpubcode.yaml files and pump it to Elastic search
  
