(function(root,factory){const d=factory();if(typeof module==="object"&&module.exports)module.exports=d;root.IslandMaps=d})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const rows=["bbbbLbbbb","bffftfffb","bfkfffpfb","bffacaffb","LfrccfrfL","bffcmfffb","bptfffkfb","bffftfffb","bbbbLbbbb"];
  const legend={b:"beach",f:"forest",c:"cave",m:"swamp",a:"camp",r:"bridge",t:"treasure",p:"trap",k:"key",L:"boat"};
  const cells=rows.flatMap((row,y)=>[...row].map((char,x)=>({x,y,type:legend[char]})));
  return{templates:{lagoon:{id:"lagoon",name:"Ostrov Modrá laguna",width:9,height:9,cells,boatStarts:[4,0],boatOptions:[[0,4],[8,4],[4,8]],bridgePairs:[[[2,4],[6,4]]]}}};
});
