// ✅ CORRIGIDO: Função para renderizar categorias em grade responsiva com ordenação
  const renderCategoriesGrid = useCallback(() => {
    console.log('🎨 Renderizando grid de categorias...');
    console.log('🎨 Todas as categorias disponíveis:', categories.length);
    console.log('🎨 Tipo selecionado:', categoryType);
    
    // ✅ CORREÇÃO: Filtrar categorias principais (sem parent_id) do tipo selecionado
    const mainCategories = categories.filter(cat => {
      const isMainCategory = !cat.parent_id || cat.parent_id === null;
      const isCorrectType = cat.type === categoryType;
      
      console.log(`🔍 Categoria: ${cat.name} | É principal: ${isMainCategory} | Tipo correto: ${isCorrectType} | Tipo: ${cat.type}`);
      
      return isMainCategory && isCorrectType;
    });

    console.log('🎨 Categorias principais filtradas:', mainCategories.length);
    
    // ✅ NOVA ORDENAÇÃO: Categorias de usuário primeiro, "Outros" por último
    const sortedMainCategories = mainCategories.sort((a, b) => {
      // 1. "Outros" sempre por último
      const aIsOthers = a.name.toLowerCase().includes('outros') || a.name.toLowerCase() === 'outros';
      const bIsOthers = b.name.toLowerCase().includes('outros') || b.name.toLowerCase() === 'outros';
      
      if (aIsOthers && !bIsOthers) return 1;  // a vai para o final
      if (!aIsOthers && bIsOthers) return -1; // b vai para o final
      
      // 2. Se ambos são "outros" ou nenhum é "outros", ordenar por is_default
      // Categorias criadas pelo usuário (!is_default) primeiro
      if (a.is_default !== b.is_default) {
        return a.is_default ? 1 : -1; // false (usuário) vem antes de true (padrão)
      }
      
      // 3. Por último, ordenar alfabeticamente
      return a.name.localeCompare(b.name);
    });

    console.log('🎨 Categorias principais ordenadas:');
    sortedMainCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.type}) - ${cat.is_default ? 'Padrão' : 'Usuário'}`);
    });

    // Função para obter subcategorias com ordenação
    const getSubcategories = (parentId: string) => {
      const subs = categories.filter(cat => cat.parent_id === parentId);
      
      // Aplicar a mesma ordenação nas subcategorias
      const sortedSubs = subs.sort((a, b) => {
        // 1. "Outros" sempre por último
        const aIsOthers = a.name.toLowerCase().includes('outros') || a.name.toLowerCase() === 'outros';
        const bIsOthers = b.name.toLowerCase().includes('outros') || b.name.toLowerCase() === 'outros';
        
        if (aIsOthers && !bIsOthers) return 1;
        if (!aIsOthers && bIsOthers) return -1;
        
        // 2. Categorias do usuário primeiro
        if (a.is_default !== b.is_default) {
          return a.is_default ? 1 : -1;
        }
        
        // 3. Ordenar alfabeticamente
        return a.name.localeCompare(b.name);
      });
      
      console.log(`🔗 Subcategorias ordenadas para ${parentId}:`, sortedSubs.length);
      return sortedSubs;
    };

    if (sortedMainCategories.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma categoria {categoryType === 'income' ? 'de receita' : 'de despesa'} encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece criando sua primeira categoria para organizar suas {categoryType === 'income' ? 'receitas' : 'despesas'}.
            </p>
            <Button onClick={handleAddCategory} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Primeira Categoria
            </Button>
          </div>
        </div>
      );
    }

    // ✅ GRID COMPLETAMENTE RESPONSIVO - Ajusta baseado no espaço disponível
    return (
      <div className="grid gap-6 auto-fit-cards">
        <style jsx>{`
          .auto-fit-cards {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          
          @media (max-width: 640px) {
            .auto-fit-cards {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .auto-fit-cards {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
          }
          
          @media (min-width: 1400px) {
            .auto-fit-cards {
              grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            }
          }
        `}</style>
        
        {sortedMainCategories.map(category => {
          const subcategories = getSubcategories(category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <Card key={category.id} className="group hover:shadow-md transition-shadow min-w-0 w-full">
              <CardContent className="p-6">
                {/* Categoria Principal */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {subcategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpandCategory(category.id)}
                        className="p-1 h-auto w-auto shrink-0"
                      >
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    )}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: category.color + '20', border: `2px solid ${category.color}` }}
                      >
                        <CategoryIcon icon={category.icon} color={category.color} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate" title={category.name}>
                          {category.name}
                        </h3>
                        {subcategories.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {subcategories.length} subcategoria{subcategories.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {category.is_default && (
                      <Badge variant="secondary" className="text-xs">Padrão</Badge>
                    )}
                    {!category.is_default && (
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                        Personalizada
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddSubcategory(category)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Subcategoria
                        </DropdownMenuItem>
                        {!category.is_default && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Subcategorias */}
                {isExpanded && subcategories.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {subcategories.map(subcat => (
                      <div key={subcat.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors group/sub">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CategoryIcon icon={subcat.icon} color={subcat.color} className="w-4 h-4 shrink-0" />
                          <span className="text-sm truncate" title={subcat.name}>
                            {subcat.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {subcat.is_default && (
                            <Badge variant="outline" className="text-xs scale-90">Padrão</Badge>
                          )}
                          {!subcat.is_default && (
                            <Badge variant="outline" className="text-xs scale-90 border-green-200 text-green-700 bg-green-50">
                              Custom
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCategory(subcat)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {!subcat.is_default && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteCategory(subcat)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }, [categories, categoryType, expandedCategories, handleEditCategory, handleDeleteCategory, handleAddSubcategory, handleAddCategory]);
