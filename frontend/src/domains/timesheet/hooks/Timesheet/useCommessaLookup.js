// (removed) legacy file intentionally left empty
export function useCommessaLookup(){
  if(import.meta?.env?.MODE!=='production'){console.warn('useCommessaLookup removed; use useReferenceData');}
  return {commesse:[],loading:false,error:'REMOVED',reload:()=>{}};
}
export default useCommessaLookup;
