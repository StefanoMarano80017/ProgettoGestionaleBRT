// (removed) legacy file intentionally left empty
export function useCommessaLookup(){
  if(process.env.NODE_ENV!=='production'){console.warn('useCommessaLookup removed; use useReferenceData');}
  return {commesse:[],loading:false,error:'REMOVED',reload:()=>{}};
}
export default useCommessaLookup;
