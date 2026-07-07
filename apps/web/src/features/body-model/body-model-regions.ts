export type BodyModelView = "front" | "back";

export type BodyModelRegionId =
  | "head"
  | "chest"
  | "back"
  | "core"
  | "left_arm"
  | "right_arm"
  | "left_leg"
  | "right_leg";

export type BodyModelRegion = {
  id: BodyModelRegionId;
  meshName: `region_${BodyModelRegionId}`;
  label: string;
  view: BodyModelView;
  summary: string;
};

export const BODY_MODEL_REGIONS: readonly BodyModelRegion[] = [
  {
    id: "head",
    meshName: "region_head",
    label: "Head and neck",
    view: "front",
    summary: "Use this region for posture, neck, and head-related notes.",
  },
  {
    id: "chest",
    meshName: "region_chest",
    label: "Chest",
    view: "front",
    summary: "Use this region for chest, upper torso, and pressing muscles.",
  },
  {
    id: "back",
    meshName: "region_back",
    label: "Back",
    view: "back",
    summary: "Use this region for upper-back, lat, and posterior torso notes.",
  },
  {
    id: "core",
    meshName: "region_core",
    label: "Core",
    view: "front",
    summary: "Use this region for abdomen, waist, and trunk stability notes.",
  },
  {
    id: "left_arm",
    meshName: "region_left_arm",
    label: "Left arm",
    view: "front",
    summary: "Use this region for the left biceps, triceps, and forearm.",
  },
  {
    id: "right_arm",
    meshName: "region_right_arm",
    label: "Right arm",
    view: "front",
    summary: "Use this region for the right biceps, triceps, and forearm.",
  },
  {
    id: "left_leg",
    meshName: "region_left_leg",
    label: "Left leg",
    view: "front",
    summary: "Use this region for the left quad, hamstring, calf, and glute.",
  },
  {
    id: "right_leg",
    meshName: "region_right_leg",
    label: "Right leg",
    view: "front",
    summary: "Use this region for the right quad, hamstring, calf, and glute.",
  },
] as const;

export const DEFAULT_BODY_MODEL_REGION_ID: BodyModelRegionId = "chest";

export function findBodyModelRegion(id: BodyModelRegionId) {
  return (
    BODY_MODEL_REGIONS.find((region) => region.id === id) ??
    BODY_MODEL_REGIONS[0]
  );
}

export function findBodyModelRegionByMeshName(meshName: string) {
  return BODY_MODEL_REGIONS.find((region) => region.meshName === meshName);
}
