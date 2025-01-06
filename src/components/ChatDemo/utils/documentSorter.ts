import { DocumentFilterCriteria, DocumentInfoType } from '../../../types';

export const getFilteredAndSortedDocuments = (
  documents: DocumentInfoType[],
  filterCriteria: DocumentFilterCriteria
) => {
  return [...documents].sort((a, b) => {
    if (filterCriteria.sort === 'title') {
      return filterCriteria.order === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (filterCriteria.sort === 'date') {
      return filterCriteria.order === 'asc'
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });
};
