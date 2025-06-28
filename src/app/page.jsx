"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Minus, Package, Plus, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";

// Datos de ejemplo siguiendo tu estructura PrimeSet
const primeInventoryData = [
  {
    name: "Ash Prime",
    category: "Warframes",
    parts: [
      {
        name: "Neuroptics",
        uniqueName: "ash_prime_neuroptics",
        required: 1,
        userCount: 0,
      },
      {
        name: "Chassis",
        uniqueName: "ash_prime_chassis",
        required: 1,
        userCount: 1,
      },
      {
        name: "Systems",
        uniqueName: "ash_prime_systems",
        required: 1,
        userCount: 1,
      },
      {
        name: "Blueprint",
        uniqueName: "ash_prime_blueprint",
        required: 1,
        userCount: 1,
      },
    ],
    isMastered: false,
  },
  {
    name: "Braton Prime",
    category: "Primary",
    parts: [
      {
        name: "Barrel",
        uniqueName: "braton_prime_barrel",
        required: 1,
        userCount: 2,
      },
      {
        name: "Receiver",
        uniqueName: "braton_prime_receiver",
        required: 1,
        userCount: 1,
      },
      {
        name: "Stock",
        uniqueName: "braton_prime_stock",
        required: 1,
        userCount: 1,
      },
      {
        name: "Blueprint",
        uniqueName: "braton_prime_blueprint",
        required: 1,
        userCount: 1,
      },
    ],
    isMastered: true,
  },
  {
    name: "Lex Prime",
    category: "Secondary",
    parts: [
      {
        name: "Barrel",
        uniqueName: "lex_prime_barrel",
        required: 1,
        userCount: 1,
      },
      {
        name: "Receiver",
        uniqueName: "lex_prime_receiver",
        required: 1,
        userCount: 1,
      },
      {
        name: "Blueprint",
        uniqueName: "lex_prime_blueprint",
        required: 1,
        userCount: 1,
      },
    ],
    isMastered: false,
  },
  {
    name: "Carrier Prime",
    category: "Sentinels",
    parts: [
      {
        name: "Carapace",
        uniqueName: "carrier_prime_carapace",
        required: 1,
        userCount: 0,
      },
      {
        name: "Cerebrum",
        uniqueName: "carrier_prime_cerebrum",
        required: 1,
        userCount: 0,
      },
      {
        name: "Systems",
        uniqueName: "carrier_prime_systems",
        required: 1,
        userCount: 1,
      },
      {
        name: "Blueprint",
        uniqueName: "carrier_prime_blueprint",
        required: 1,
        userCount: 1,
      },
    ],
    isMastered: false,
  },
  {
    name: "Primed Continuity",
    category: "Mods",
    parts: [], // Mod sin componentes
    isMastered: false,
    userCount: 1,
    required: 1,
  },
];

const categories = [
  "All",
  "Warframes",
  "Primary",
  "Secondary",
  "Melee",
  "Sentinels",
  "Mods",
];
const statusFilters = [
  "All",
  "Buildable",
  "Incomplete",
  "Mastered",
  "Extra Sets",
];

// Componente PrimePart según tu especificación
function PrimePart({ part, onUpdateCount }) {
  const getPartColor = () => {
    if (part.userCount === 0)
      return "text-red-400 bg-red-950/30 border-red-800/50";
    if (part.userCount < part.required)
      return "text-amber-400 bg-amber-950/30 border-amber-800/50";
    return "text-green-400 bg-green-950/30 border-green-800/50";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border-2 ${getPartColor()} backdrop-blur-sm gap-3`}
    >
      <span className='font-medium'>{part.name}</span>
      <div className='flex items-center space-x-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            onUpdateCount(part.uniqueName, Math.max(0, part.userCount - 1))
          }
          className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
        >
          <Minus className='h-4 w-4' />
        </Button>

        <div className='flex items-center space-x-1'>
          <Input
            type='number'
            value={part.userCount}
            onChange={(e) =>
              onUpdateCount(
                part.uniqueName,
                Number.parseInt(e.target.value) || 0
              )
            }
            className='w-14 h-8 text-center bg-gray-800/50 border-gray-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            min='0'
          />
          <span className='text-sm font-medium text-gray-400'>
            /{part.required}
          </span>
        </div>

        <Button
          size='sm'
          variant='outline'
          onClick={() => onUpdateCount(part.uniqueName, part.userCount + 1)}
          className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
        >
          <Plus className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// Componente PrimeSet según tu especificación
function PrimeSet({
  primeSet,
  onUpdatePart,
  onToggleMastery,
  onBuild,
  onSell,
}) {
  const isBuildable =
    primeSet.parts?.every((part) => part.userCount >= part.required) ??
    primeSet.userCount >= primeSet.required;

  const getSetColor = () => {
    if (!isBuildable) return "bg-gray-800/40 border-gray-700/50";
    if (isBuildable && !primeSet.isMastered)
      return "bg-green-900/20 border-green-700/50";
    if (isBuildable && primeSet.isMastered)
      return "bg-amber-900/20 border-amber-600/50";
    return "bg-gray-800/40 border-gray-700/50";
  };

  const getSetStatus = () => {
    if (!isBuildable) return "Incomplete";
    if (isBuildable && !primeSet.isMastered) return "Ready to Build";
    if (isBuildable && primeSet.isMastered) return "Extra Set";
    return "Unknown";
  };

  const getStatusBadgeColor = () => {
    if (getSetStatus() === "Ready to Build")
      return "bg-green-600 hover:bg-green-700";
    if (getSetStatus() === "Extra Set")
      return "bg-amber-600 hover:bg-amber-700";
    return "bg-gray-600 hover:bg-gray-700";
  };

  return (
    <Card
      className={`${getSetColor()} transition-all duration-200 backdrop-blur-sm`}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-bold text-white'>
            {primeSet.name}
          </CardTitle>
          <div className='flex items-center space-x-2'>
            <Badge
              variant='secondary'
              className='text-xs bg-gray-700 text-gray-300'
            >
              {primeSet.category}
            </Badge>
            <Badge className={`text-xs text-white ${getStatusBadgeColor()}`}>
              {getSetStatus()}
            </Badge>
          </div>
        </div>

        {/* Botón Mastered Toggle */}
        <Button
          onClick={() => onToggleMastery(primeSet.name)}
          variant='outline'
          size='sm'
          className={`w-fit transition-all duration-200 ${
            primeSet.isMastered
              ? "bg-amber-600/20 border-amber-500 text-amber-400 hover:bg-amber-600/30"
              : "bg-gray-800/30 border-gray-600 text-gray-400 hover:bg-gray-700/50 opacity-60"
          }`}
        >
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                primeSet.isMastered ? "bg-amber-400" : "bg-gray-500"
              }`}
            />
            <span className='text-sm font-medium'>
              {primeSet.isMastered ? "Mastered" : "Not Mastered"}
            </span>
          </div>
        </Button>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Partes del set */}
        {primeSet.parts && primeSet.parts.length > 0 ? (
          <div className='space-y-2'>
            {primeSet.parts.map((part) => (
              <PrimePart
                key={part.uniqueName}
                part={part}
                onUpdateCount={onUpdatePart}
              />
            ))}
          </div>
        ) : (
          // Para mods Prime sin componentes
          <div className='flex items-center justify-between p-3 rounded-lg border-2 bg-sky-950/30 border-sky-800/50 backdrop-blur-sm'>
            <span className='font-medium text-sky-400'>Direct Item</span>
            <div className='flex items-center space-x-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  onUpdatePart(
                    primeSet.name,
                    Math.max(0, (primeSet.userCount || 0) - 1)
                  )
                }
                className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
              >
                <Minus className='h-4 w-4' />
              </Button>

              <div className='flex items-center space-x-1'>
                <Input
                  type='number'
                  value={primeSet.userCount || 0}
                  onChange={(e) =>
                    onUpdatePart(
                      primeSet.name,
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className='w-16 h-8 text-center bg-gray-800/50 border-gray-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                  min='0'
                />
                <span className='text-sm font-medium text-gray-400'>
                  /{primeSet.required || 1}
                </span>
              </div>

              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  onUpdatePart(primeSet.name, (primeSet.userCount || 0) + 1)
                }
                className='h-8 w-8 p-0 bg-gray-800/50 border-gray-600 hover:bg-gray-700 text-gray-300'
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className='flex space-x-2 pt-2'>
          <Button
            onClick={() => onBuild(primeSet)}
            disabled={!isBuildable}
            className='flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-700 disabled:text-gray-400'
            size='sm'
          >
            Build
          </Button>
          <Button
            onClick={() => onSell(primeSet)}
            disabled={!isBuildable}
            variant='outline'
            className='flex-1 bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700'
            size='sm'
          >
            Sell
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PrimeInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [inventory, setInventory] = useState(primeInventoryData);

  // Filtrar sets basado en búsqueda, categoría y estado
  const filteredSets = useMemo(() => {
    return inventory.filter((set) => {
      const matchesSearch = set.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || set.category === selectedCategory;

      // Filtro por estado
      const isBuildable =
        set.parts?.every((part) => part.userCount >= part.required) ??
        (set.userCount || 0) >= (set.required || 1);
      let matchesStatus = true;

      if (selectedStatus === "Buildable")
        matchesStatus = isBuildable && !set.isMastered;
      else if (selectedStatus === "Incomplete") matchesStatus = !isBuildable;
      else if (selectedStatus === "Mastered") matchesStatus = set.isMastered;
      else if (selectedStatus === "Extra Sets")
        matchesStatus = isBuildable && set.isMastered;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, selectedStatus, inventory]);

  // Estadísticas del inventario
  const stats = useMemo(() => {
    const total = inventory.length;
    const buildable = inventory.filter((set) => {
      const isBuildable =
        set.parts?.every((part) => part.userCount >= part.required) ??
        (set.userCount || 0) >= (set.required || 1);
      return isBuildable && !set.isMastered;
    }).length;
    const mastered = inventory.filter((set) => set.isMastered).length;

    return { total, buildable, mastered };
  }, [inventory]);

  const handleUpdatePart = (uniqueName, newCount) => {
    // Aquí implementarías la lógica real
    console.log(`Update ${uniqueName} to ${newCount}`);
  };

  const handleToggleMastery = (setName) => {
    // Aquí implementarías la lógica real
    console.log(`Toggle mastery for ${setName}`);
  };

  const handleBuild = (primeSet) => {
    // Aquí implementarías la lógica real
    console.log(`Build ${primeSet.name}`);
  };

  const handleSell = (primeSet) => {
    // Aquí implementarías la lógica real
    console.log(`Sell ${primeSet.name}`);
  };

  const handleImport = () => {
    console.log("Import inventory");
  };

  const handleExport = () => {
    console.log("Export inventory");
  };

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      {/* Navbar flotante estilo Warframe */}
      <nav className='sticky top-4 z-50 mx-4 mb-6'>
        <div className='bg-gray-800/90 backdrop-blur-md border border-amber-500/30 rounded-xl shadow-2xl'>
          <div className='max-w-7xl mx-auto px-6 py-4'>
            <div className='flex items-center justify-between'>
              {/* Logo */}
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-amber-600 rounded-lg'>
                  <Package className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h1 className='text-xl font-bold text-white'>
                    Prime Inventory
                  </h1>
                  <p className='text-xs text-amber-300'>Warframe Manager</p>
                </div>
              </div>

              {/* Barra de búsqueda central */}
              <div className='flex-1 max-w-md mx-8'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    type='text'
                    placeholder='Search Prime items...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500'
                  />
                </div>
              </div>

              {/* Botones de Import/Export */}
              <div className='flex items-center space-x-3'>
                <Button
                  variant='outline'
                  onClick={handleImport}
                  className='bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600 hover:border-sky-500'
                >
                  <Upload className='h-4 w-4 mr-2' />
                  Import
                </Button>
                <Button
                  onClick={handleExport}
                  className='bg-amber-600 hover:bg-amber-700 text-white'
                >
                  <Download className='h-4 w-4 mr-2' />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8'>
        {/* Panel de estadísticas y filtros */}
        <div className='mb-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6'>
          {/* Estadísticas */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-gray-700/50 rounded-lg p-4 text-center border border-gray-600'>
              <div className='text-2xl font-bold text-white'>{stats.total}</div>
              <div className='text-sm text-gray-300'>Total Sets</div>
            </div>
            <div className='bg-green-900/30 rounded-lg p-4 text-center border border-green-700/50'>
              <div className='text-2xl font-bold text-green-400'>
                {stats.buildable}
              </div>
              <div className='text-sm text-gray-300'>Ready to Build</div>
            </div>
            <div className='bg-amber-900/30 rounded-lg p-4 text-center border border-amber-600/50'>
              <div className='text-2xl font-bold text-amber-400'>
                {stats.mastered}
              </div>
              <div className='text-sm text-gray-300'>Mastered</div>
            </div>
          </div>

          {/* Filtros */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='sm:w-48'>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className='bg-gray-700/50 border-gray-600 text-white focus:border-amber-500'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent className='bg-gray-800 border-gray-600'>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className='text-white hover:bg-gray-700'
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='sm:w-48'>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className='bg-gray-700/50 border-gray-600 text-white focus:border-amber-500'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent className='bg-gray-800 border-gray-600'>
                  {statusFilters.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className='text-white hover:bg-gray-700'
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex-1 text-sm text-gray-300 flex items-center'>
              Showing {filteredSets.length} of {inventory.length} Prime sets
            </div>
          </div>
        </div>

        {/* Grid de Prime Sets */}
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
          {filteredSets.map((primeSet) => (
            <PrimeSet
              key={primeSet.name}
              primeSet={primeSet}
              onUpdatePart={handleUpdatePart}
              onToggleMastery={handleToggleMastery}
              onBuild={handleBuild}
              onSell={handleSell}
            />
          ))}
        </div>

        {/* Mensaje cuando no hay resultados */}
        {filteredSets.length === 0 && (
          <div className='text-center py-12'>
            <Package className='h-12 w-12 text-gray-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-white mb-2'>
              No Prime sets found
            </h3>
            <p className='text-gray-400'>
              Try adjusting your search filters to find what you're looking for.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className='bg-gray-800/50 border-t border-gray-700 mt-auto'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center text-sm text-gray-400'>
            © {new Date().getFullYear()} Prime Inventory. Warframe content and
            materials are trademarks of Digital Extremes Ltd.
          </div>
        </div>
      </footer>
    </div>
  );
}
