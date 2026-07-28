(function(root,factory){const d=factory();if(typeof module==="object"&&module.exports)module.exports=d;root.WhisperPrompts=d})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const adjectives=["veselý","ospalý","zvědavý","kouzelný","pruhovaný","puntíkovaný","malinký","obrovský","tančící","zpívající","létající","skákající","usměvavý","hladový","statečný","barevný","chlupatý","rychlý","zamrzlý","nafukovací"];
  const nouns=["slon s kloboukem","pes na kole","kočka u okna","drak v pyžamu","robot s květinou","jednorožec na obláčku","pirát s dortem","žába s deštníkem","medvěd na lyžích","králík v raketě","tučňák na pláži","lev s batohem"];
  return{prompts:adjectives.flatMap((a,i)=>nouns.map((n,j)=>({id:`prompt-${i+1}-${j+1}`,text:`${a} ${n}`,difficulty:1+((i+j)%3)})))};
});
