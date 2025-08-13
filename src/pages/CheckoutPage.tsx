                      <div className="space-y-2">
                        <Label htmlFor="category-type">Tipo</Label>
                        <Select
                          value={categoryForm.type}
                          onValueChange={(value) => setCategoryForm({ ...categoryForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="income">Receita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-parent">Categoria Pai</Label>
                        <Select
                          value={categoryForm.parent_id || ''}
                          onValueChange={(value) => setCategoryForm({ ...categoryForm, parent_id: value || null })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Categoria Principal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma (Principal)</SelectItem>
                             {/* ✅ CORREÇÃO 3: Verificação antes de mapear */}
                            {categories && categories.filter(cat => !cat.parent_id).map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setCategoryForm({ ...categoryForm, color })}
                              className={`w-8 h-8 rounded-full border-2 ${
                                categoryForm.color === color ? 'border-primary' : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetCategoryForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveCategory}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {renderCategoryTree()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Fornecedores */}
        <TabsContent value="fornecedores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fornecedores e Clientes</CardTitle>
                  <CardDescription>
                    Gerencie seus fornecedores e clientes
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingItem(null);
                  setSupplierForm({ name: '', type: 'supplier', document: '', email: '', phone: '', address: '' });
                  setShowSupplierForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Fornecedor/Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showSupplierForm && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier-name">Nome</Label>
                        <Input
                          id="supplier-name"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                          placeholder="Nome do fornecedor/cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-type">Tipo</Label>
                        <Select
                          value={supplierForm.type}
                          onValueChange={(value) => setSupplierForm({ ...supplierForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supplier">Fornecedor</SelectItem>
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-document">Documento</Label>
                        <Input
                          id="supplier-document"
                          value={supplierForm.document}
                          onChange={(e) => setSupplierForm({ ...supplierForm, document: e.target.value })}
                          placeholder="CPF/CNPJ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-email">Email</Label>
                        <Input
                          id="supplier-email"
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-phone">Telefone</Label>
                        <Input
                          id="supplier-phone"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-address">Endereço</Label>
                        <Input
                          id="supplier-address"
                          value={supplierForm.address}
                          onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                          placeholder="Endereço completo"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetSupplierForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveSupplier}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {suppliers.map(supplier => (
                  <Card key={supplier.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{supplier.name}</span>
                        <Badge variant="outline">
                          {supplier.type === 'supplier' ? 'Fornecedor' :
                            supplier.type === 'client' ? 'Cliente' : 'Ambos'}
                        </Badge>
                        {supplier.document && (
                          <span className="text-sm text-muted-foreground">{supplier.document}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Métodos de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Formas de Pagamento</CardTitle>
                  <CardDescription>
                    Configure os métodos de pagamento disponíveis
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingItem(null);
                  setPaymentForm({ name: '', type: 'both', is_default: false });
                  setShowPaymentForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Forma de Pagamento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPaymentForm && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-name">Nome</Label>
                        <Input
                          id="payment-name"
                          value={paymentForm.name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                          placeholder="Nome do método de pagamento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-type">Tipo</Label>
                        <Select
                          value={paymentForm.type}
                          onValueChange={(value) => setPaymentForm({ ...paymentForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Apenas Receitas</SelectItem>
                            <SelectItem value="expense">Apenas Despesas</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetPaymentForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePayment}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {paymentMethods.map(payment => (
                  <Card key={payment.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{payment.name}</span>
                        <Badge variant={payment.is_default ? 'default' : 'secondary'}>
                          {payment.is_default ? 'Padrão' : 'Normal'}
                        </Badge>
                        <Badge variant="outline">
                          {payment.type === 'receipt' ? 'Receitas' :
                            payment.type === 'payment' ? 'Despesas' : 'Ambos'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
