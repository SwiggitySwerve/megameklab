import type { NextApiRequest, NextApiResponse } from 'next';
import { getEquipmentCategories, getTechBases, getRulesLevels } from '../../../services/equipmentService';

interface FilterOptions {
  categories: string[];
  techBases: string[];
  rulesLevels: string[];
}

export default function handler(req: NextApiRequest, res: NextApiResponse<FilterOptions>) {
  try {
    const categories = getEquipmentCategories();
    const techBases = getTechBases();
    const rulesLevels = getRulesLevels();

    return res.status(200).json({
      categories,
      techBases,
      rulesLevels
    });

  } catch (error: any) {
    console.error('Error fetching equipment filters:', error);
    return res.status(500).json({
      categories: [],
      techBases: [],
      rulesLevels: []
    });
  }
}
