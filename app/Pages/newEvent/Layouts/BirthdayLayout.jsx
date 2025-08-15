'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Gift,
  Cake,
  ExternalLink,
  Loader2,
  PartyPopper,
  Star
} from "lucide-react";

export function BirthdayLayout({
  event,
  dateLabel,
  name,
  setName,
  companions,
  addCompanion,
  removeCompanion,
  editCompanion,
  onSubmit,
  canSubmit,
  submitting,
  error,
  done,
  openInMapsUrl,
  formatPrice
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      {/* Fun Birthday Hero */}
      <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Animated decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-300 rounded-full animate-bounce opacity-80"></div>
          <div className="absolute top-20 right-20 w-6 h-6 bg-pink-300 rounded-full animate-bounce delay-300 opacity-80"></div>
          <div className="absolute bottom-32 left-1/4 w-10 h-10 bg-purple-300 rounded-full animate-bounce delay-700 opacity-80"></div>
          <div className="absolute bottom-20 right-1/3 w-4 h-4 bg-orange-300 rounded-full animate-bounce delay-1000 opacity-80"></div>
          
          {/* Confetti effect */}
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-300 transform rotate-45 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-green-300 transform rotate-45 animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-yellow-300 transform rotate-45 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-28 h-28 mb-6 rounded-full bg-white/20 backdrop-blur-sm">
              <Cake className="h-14 w-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-wide transform hover:scale-105 transition-transform">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-2xl md:text-3xl opacity-95 mb-8 max-w-4xl mx-auto font-bold">
              🎉 {event.description} 🎉
            </p>
          )}
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-xl">
            <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Calendar className="h-6 w-6" />
              <span className="font-bold">{dateLabel}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                <MapPin className="h-6 w-6" />
                <span className="font-bold">{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {done ? (
          <Card className="max-w-2xl mx-auto shadow-2xl bg-gradient-to-br from-white to-yellow-50 border-4 border-yellow-300">
            <CardContent className="text-center p-12">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 mb-8 animate-pulse">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">🎉 Presença Confirmada! 🎉</h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                Oba! Sua presença está confirmada! {event.location ? `Te esperamos em ${event.location} ` : ''}
                no dia {dateLabel} para uma festa inesquecível!
              </p>
              <div className="flex justify-center gap-4 text-3xl mb-4">
                <PartyPopper className="text-purple-500 animate-bounce" />
                <Star className="text-pink-500 animate-bounce delay-200" />
                <Star className="text-yellow-500 animate-bounce delay-400" />
              </div>
              <div className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <p className="text-lg font-semibold text-purple-700">
                  🎂 Prepare-se para muita diversão! 🎈
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main RSVP Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl bg-gradient-to-br from-white to-purple-50 border-4 border-purple-200">
                <CardContent className="p-8">
                  <div className="mb-8 text-center">
                    <div className="flex justify-center gap-2 mb-4">
                      <PartyPopper className="h-8 w-8 text-purple-500 animate-bounce" />
                      <Star className="h-8 w-8 text-pink-500 animate-bounce delay-200" />
                      <Star className="h-8 w-8 text-yellow-500 animate-bounce delay-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary mb-3">Vem Comemorar Comigo!</h2>
                    <p className="text-lg text-muted-foreground">
                      Será muito mais divertido com você na festa! 🎈
                    </p>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-lg font-bold text-primary">Seu nome completo *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Digite seu nome e sobrenome"
                        required
                        className="mt-3 h-14 text-lg border-3 border-purple-200 focus:border-purple-400 bg-white/80"
                      />
                    </div>

                    {event.allow_companion && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-lg font-bold text-primary">Traga seus amigos! 👯‍♀️</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={addCompanion}
                            className="border-2 border-purple-400 text-purple-600 hover:bg-purple-100 font-bold"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Adicionar Amigo
                          </Button>
                        </div>

                        {companions.length > 0 && (
                          <div className="space-y-3">
                            {companions.map((companion, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <Input
                                  value={companion}
                                  onChange={(e) => editCompanion(i, e.target.value)}
                                  placeholder={`Nome do amigo ${i + 1} 🎊`}
                                  className="flex-1 h-12 border-2 border-pink-200 focus:border-pink-400 bg-white/80"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCompanion(i)}
                                  className="border-2 border-red-300 text-red-500 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="p-4 border-3 border-red-300 bg-red-50 rounded-xl">
                        <p className="text-red-600 font-bold">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      size="lg"
                      className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:opacity-90 shadow-xl transform hover:scale-105 transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <Cake className="h-6 w-6 mr-3" />
                          Confirmar Presença 🎉
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Fun Details Sidebar */}
            <div className="space-y-6">
              {/* Location Card */}
              {event.location && (
                <Card className="shadow-lg bg-gradient-to-br from-white to-yellow-50 border-3 border-yellow-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-yellow-200">
                        <MapPin className="h-6 w-6 text-yellow-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-primary mb-2">🏟️ Local da Festa</h3>
                        <p className="text-muted-foreground mb-4 font-medium">{event.location}</p>
                        <Button variant="outline" size="lg" asChild className="w-full border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-100 font-bold">
                          <a href={openInMapsUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-5 w-5 mr-2" />
                            Ver no Mapa 🗺️
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gift List */}
              {event.gifts && event.gifts.length > 0 && (
                <Card className="shadow-lg bg-gradient-to-br from-white to-pink-50 border-3 border-pink-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-full bg-pink-200">
                        <Gift className="h-6 w-6 text-pink-700" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">🎁 Lista de Presentes</h3>
                    </div>
                    <div className="space-y-4">
                      {event.gifts.map((gift) => (
                        <div key={gift.id} className="p-4 border-3 border-pink-200 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 hover:shadow-lg transition-all transform hover:scale-105">
                          <div className="font-bold text-primary mb-2 text-lg">{gift.title}</div>
                          <div className="flex items-center justify-between">
                            {formatPrice(gift.price_cents) && (
                              <span className="text-xl font-bold text-pink-600">
                                {formatPrice(gift.price_cents)}
                              </span>
                            )}
                            {gift.link && (
                              <Button variant="outline" size="sm" asChild className="border-2 border-purple-300 text-purple-600 hover:bg-purple-100 font-bold">
                                <a href={gift.link} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver Presente 🛍️
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fun Message Card */}
              <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 border-3 border-purple-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🎂</div>
                  <h3 className="text-lg font-bold text-primary mb-2">Será uma festa incrível!</h3>
                  <p className="text-muted-foreground font-medium">
                    Prepare-se para muita música, dança, comida deliciosa e diversão garantida! 🎵🕺💃
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}