export type ReportStatus = "未出报告" | "已出报告";
export type ReportIndicatorType = "数值型" | "文本型" | "枚举型" | "多选枚举" | "布尔型";
export type IndicatorDefinition = { name: string; type: ReportIndicatorType; unit?: string; referenceRange?: string; options?: string[]; trueLabel?: string; falseLabel?: string };
export type IndicatorValue = { name: string; eye: "OD" | "OS" | "OU" | "无眼别"; value: string; unit?: string; abnormal?: boolean };
export type ReportDocument = { id: string; label: string; eye: string; url: string; reporter: string; reportTime: string };
export type Report = {
  id: string;
  visit: string;
  department: string;
  doctor: string;
  project: string;
  code: string;
  status: ReportStatus;
  reporter?: string;
  reportTime?: string;
  source: "医技检查" | "护士采集" | "医生查体" | "医生补录";
  summary: string[];
  values?: IndicatorValue[];
  originalAvailable?: boolean;
  revisedBy?: string;
  revisedTime?: string;
  documents?: ReportDocument[];
};

export const reportIndicatorDefinitions: IndicatorDefinition[] = [
  {name:"Ks曲率",type:"数值型",unit:"D",referenceRange:"40.00～48.00D"},
  {name:"Ks轴位",type:"数值型",unit:"°",referenceRange:"0～180°"},
  {name:"MinK曲率",type:"数值型",unit:"D",referenceRange:"40.00～48.00D"},
  {name:"MinK轴位",type:"数值型",unit:"°",referenceRange:"0～180°"},
  {name:"眼轴长度",type:"数值型",unit:"mm",referenceRange:"22.00～26.00mm"},
  {name:"角膜厚度",type:"数值型",unit:"μm",referenceRange:"500～600μm"},
  {name:"前房深度",type:"数值型",unit:"mm",referenceRange:"2.50～4.50mm"},
  {name:"眼压",type:"数值型",unit:"mmHg",referenceRange:"10～21mmHg"},
  {name:"NIBUT First",type:"数值型",unit:"s",referenceRange:">10s"},
  {name:"NIBUT Average",type:"数值型",unit:"s",referenceRange:">14s"},
  {name:"泪河高度 TMH",type:"数值型",unit:"mm",referenceRange:"0.20～0.40mm"},
  {name:"角膜",type:"枚举型",referenceRange:"清亮",options:["清亮","散在点染","上皮缺损","混浊","水肿","瘢痕"]},
  {name:"晶状体",type:"枚举型",referenceRange:"透明",options:["透明","混浊","人工晶体","无晶体"]},
];

export function indicatorDefinition(value: Pick<IndicatorValue,"name"|"unit">): IndicatorDefinition {
  return reportIndicatorDefinitions.find(item=>item.name===value.name&&(!item.unit||item.unit===value.unit))??{name:value.name,type:"文本型",unit:value.unit,referenceRange:"—"};
}

export const projectCatalog = [
  { name: "裸眼及矫正视力", code: "VISION" },
  { name: "电脑验光", code: "REFRACTION" },
  { name: "眼压", code: "IOP" },
  { name: "眼生物测量", code: "BIOMETRY" },
  { name: "角膜地形图", code: "TOPO" },
  { name: "眼表综合报告", code: "OCULAR_SURFACE" },
  { name: "眼健康检查", code: "EYE_HEALTH" },
];

const topo = (od:string,oda:string,odm:string,odma:string,os:string,osa:string,osm:string,osma:string):IndicatorValue[] => [
  {name:"Ks曲率",eye:"OD",value:od,unit:"D"},{name:"Ks轴位",eye:"OD",value:oda,unit:"°"},{name:"MinK曲率",eye:"OD",value:odm,unit:"D"},{name:"MinK轴位",eye:"OD",value:odma,unit:"°"},
  {name:"Ks曲率",eye:"OS",value:os,unit:"D"},{name:"Ks轴位",eye:"OS",value:osa,unit:"°"},{name:"MinK曲率",eye:"OS",value:osm,unit:"D"},{name:"MinK轴位",eye:"OS",value:osma,unit:"°"},
];

const historyDates=["2025-09-06 09:18","2025-06-08 10:05","2025-03-02 08:46","2024-12-01 09:32","2024-09-08 10:14"];
const historyReports:Report[]=historyDates.flatMap((time,index)=>{
  const n=index*0.08;
  const visit=time.slice(0,10)+" 08:30";
  return [
    {id:`ht-${index}`,visit,department:"眼视光中心",doctor:"徐学庆",project:"角膜地形图",code:"TOPO",status:"已出报告",reporter:index%2?"陈楠":"黄丽萍",reportTime:time,source:"医技检查",summary:[`OD：Ks ${(43.33-n).toFixed(2)}D@${78-index}°；MinK ${(42.48-n).toFixed(2)}D@${174-index}°`,`OS：Ks ${(43.20-n).toFixed(2)}D@${155-index}°；MinK ${(42.82-n).toFixed(2)}D@${66+index}°`],values:topo((43.33-n).toFixed(2),String(78-index),(42.48-n).toFixed(2),String(174-index),(43.20-n).toFixed(2),String(155-index),(42.82-n).toFixed(2),String(66+index))} as Report,
    {id:`hb-${index}`,visit,department:"眼视光中心",doctor:"徐学庆",project:"眼生物测量",code:"BIOMETRY",status:"已出报告",reporter:"陈楠",reportTime:time.replace("09:","08:"),source:"医技检查",summary:[`OD：眼轴 ${(24.20-index*0.04).toFixed(2)}mm；OS：眼轴 ${(24.12-index*0.04).toFixed(2)}mm`],values:[{name:"眼轴长度",eye:"OD",value:(24.20-index*0.04).toFixed(2),unit:"mm"},{name:"眼轴长度",eye:"OS",value:(24.12-index*0.04).toFixed(2),unit:"mm"}]} as Report,
    {id:`hs-${index}`,visit,department:"眼视光中心",doctor:"徐学庆",project:"眼表综合报告",code:"OCULAR_SURFACE",status:"已出报告",reporter:"周敏",reportTime:time.replace("09:","08:"),source:"医技检查",summary:[`OD：NIBUT First ${(9.8+index*.4).toFixed(2)}s；TMH ${(0.24+index*.01).toFixed(2)}mm`,`OS：NIBUT First ${(10.1+index*.3).toFixed(2)}s；TMH ${(0.25+index*.01).toFixed(2)}mm`],values:[{name:"NIBUT First",eye:"OD",value:(9.8+index*.4).toFixed(2),unit:"s"},{name:"泪河高度 TMH",eye:"OD",value:(0.24+index*.01).toFixed(2),unit:"mm"},{name:"NIBUT First",eye:"OS",value:(10.1+index*.3).toFixed(2),unit:"s"},{name:"泪河高度 TMH",eye:"OS",value:(0.25+index*.01).toFixed(2),unit:"mm"}]} as Report,
    {id:`hn-${index}`,visit,department:"眼视光中心",doctor:"徐学庆",project:"眼压",code:"IOP",status:"已出报告",reporter:index%2?"李晓":"王静",reportTime:time.replace("09:","08:"),source:"护士采集",summary:[`OD：${14+index}mmHg；OS：${15+index}mmHg`],values:[{name:"眼压",eye:"OD",value:String(14+index),unit:"mmHg",abnormal:index===4},{name:"眼压",eye:"OS",value:String(15+index),unit:"mmHg",abnormal:index===4}]} as Report,
  ];
});

export const reports: Report[] = [
  {id:"r1",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"角膜地形图",code:"TOPO",status:"已出报告",reporter:"黄丽萍",reportTime:"2026-08-02 09:28",source:"医技检查",originalAvailable:true,documents:[{id:"r1-od",label:"右眼报告",eye:"OD",url:"/sample-reports/topography-desensitized.pdf#page=1",reporter:"黄丽萍",reportTime:"2026-08-02 09:28"},{id:"r1-os",label:"左眼报告",eye:"OS",url:"/sample-reports/topography-desensitized.pdf#page=2",reporter:"黄丽萍",reportTime:"2026-08-02 09:29"}],summary:["OD：Ks 43.83D@83°；MinK 42.79D@179°","OS：Ks 43.60D@159°；MinK 43.10D@63°","睑裂高度：OD 10mm，OS 10mm；眼睑张力：双眼正常"],values:topo("43.83","83","42.79","179","43.60","159","43.10","63")},
  {id:"r2",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"眼表综合报告",code:"OCULAR_SURFACE",status:"已出报告",reporter:"黄丽萍",reportTime:"2026-08-02 09:32",source:"医技检查",originalAvailable:true,summary:["OD：NIBUT First 9.05s；NIBUT Average 18.03s；TMH 0.25mm","OS：NIBUT First 9.42s；NIBUT Average 18.61s；TMH 0.24mm"],values:[{name:"NIBUT First",eye:"OD",value:"9.05",unit:"s",abnormal:true},{name:"NIBUT Average",eye:"OD",value:"18.03",unit:"s"},{name:"泪河高度 TMH",eye:"OD",value:"0.25",unit:"mm"}]},
  {id:"r3",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"眼生物测量",code:"BIOMETRY",status:"已出报告",reporter:"陈楠",reportTime:"2026-08-02 09:18",source:"医技检查",originalAvailable:true,documents:[{id:"r3-ou",label:"双眼报告",eye:"OU",url:"/sample-reports/biometry-desensitized.pdf",reporter:"陈楠",reportTime:"2026-08-02 09:18"}],summary:["OD：眼轴 24.37mm；角膜厚度 542μm；前房深度 3.62mm","OS：眼轴 24.30mm；角膜厚度 538μm；前房深度 3.59mm"],values:[{name:"眼轴长度",eye:"OD",value:"24.37",unit:"mm"},{name:"角膜厚度",eye:"OD",value:"542",unit:"μm"},{name:"前房深度",eye:"OD",value:"3.62",unit:"mm"},{name:"眼轴长度",eye:"OS",value:"24.30",unit:"mm"},{name:"角膜厚度",eye:"OS",value:"538",unit:"μm"},{name:"前房深度",eye:"OS",value:"3.59",unit:"mm"}]},
  {id:"r4",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"眼压",code:"IOP",status:"已出报告",reporter:"李晓",reportTime:"2026-08-02 09:08",source:"护士采集",summary:["OD：15mmHg；OS：16mmHg"],values:[{name:"眼压",eye:"OD",value:"15",unit:"mmHg"},{name:"眼压",eye:"OS",value:"16",unit:"mmHg"}]},
  {id:"r4b",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"眼压",code:"IOP",status:"已出报告",reporter:"王静",reportTime:"2026-08-02 08:42",source:"护士采集",summary:["OD：16mmHg；OS：16mmHg"],values:[{name:"眼压",eye:"OD",value:"16",unit:"mmHg"},{name:"眼压",eye:"OS",value:"16",unit:"mmHg"}]},
  {id:"r5",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"眼健康检查",code:"EYE_HEALTH",status:"已出报告",reporter:"方红全",reportTime:"2026-08-02 10:12",source:"医生查体",summary:["双眼：眼睑正常；睑结膜无明显充血；球结膜无明显充血；角膜清亮；前房不浅；晶状体透明；眼底未见明显异常"],values:[{name:"角膜",eye:"OU",value:"清亮"},{name:"晶状体",eye:"OU",value:"透明"}]},
  {id:"r6",visit:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",project:"电脑验光",code:"REFRACTION",status:"未出报告",source:"医技检查",summary:["检查已开立，等待报告"]},
  {id:"r7",visit:"2026-05-10 09:12",department:"眼视光中心",doctor:"徐学庆",project:"角膜地形图",code:"TOPO",status:"已出报告",reporter:"周敏",reportTime:"2026-05-10 08:50",source:"医生补录",originalAvailable:true,revisedBy:"徐学庆",revisedTime:"2026-05-10 09:20",summary:["OD：Ks 43.62D@82°；MinK 42.65D@178°","OS：Ks 43.44D@158°；MinK 43.02D@64°"],values:topo("43.62","82","42.65","178","43.44","158","43.02","64")},
  {id:"r8",visit:"2025-11-28 14:20",department:"眼视光中心",doctor:"徐学庆",project:"角膜地形图",code:"TOPO",status:"已出报告",reporter:"陈楠",reportTime:"2025-11-28 13:56",source:"医技检查",originalAvailable:true,summary:["OD：Ks 43.41D@80°；MinK 42.51D@176°","OS：Ks 43.28D@157°；MinK 42.88D@65°"],values:topo("43.41","80","42.51","176","43.28","157","42.88","65")},
  {id:"r9",visit:"2026-05-10 09:12",department:"眼视光中心",doctor:"徐学庆",project:"眼生物测量",code:"BIOMETRY",status:"已出报告",reporter:"陈楠",reportTime:"2026-05-10 08:35",source:"医技检查",originalAvailable:true,summary:["OD：眼轴 24.24mm；OS：眼轴 24.15mm"],values:[{name:"眼轴长度",eye:"OD",value:"24.24",unit:"mm"},{name:"眼轴长度",eye:"OS",value:"24.15",unit:"mm"}]},
  ...historyReports,
];

export const visits = [
  {time:"2026-08-02 10:36",department:"眼视光中心",doctor:"方红全",type:"初诊 · OK镜评估"},
  {time:"2026-05-10 09:12",department:"眼视光中心",doctor:"徐学庆",type:"复诊"},
  {time:"2025-11-28 14:20",department:"眼视光中心",doctor:"徐学庆",type:"复诊"},
];

export function visibleReports(projects:string[],status:string){return reports.filter(r=>(!projects.length||projects.includes(r.project))&&(!status||r.status===status));}
export function projectReports(project:string){return reports.filter(r=>r.project===project&&r.status==="已出报告").sort((a,b)=>(b.reportTime??"").localeCompare(a.reportTime??""));}
export function trendPoints(project:string,indicator:string,eye:string){return projectReports(project).flatMap(r=>(r.values??[]).filter(v=>v.name===indicator&&v.eye===eye).map(v=>({date:r.reportTime??r.visit,value:Number(v.value),report:r.id}))).reverse();}
