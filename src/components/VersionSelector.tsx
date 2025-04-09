
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppVersion, VersionInfo } from '@/App';
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Info } from 'lucide-react';

interface VersionSelectorProps {
  currentVersion: string;
  onChange: (version: string) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ currentVersion, onChange }) => {
  const { versionInfo, currentVersionInfo } = useAppVersion();

  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="version-select">App Version</Label>
        <div className="flex items-center gap-2">
          <Select value={currentVersion} onValueChange={onChange}>
            <SelectTrigger id="version-select" className="w-[140px]">
              <SelectValue placeholder="Select Version" />
            </SelectTrigger>
            <SelectContent position="popper">
              {versionInfo.map((version) => (
                <SelectItem key={version.version} value={version.version}>
                  {version.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="rounded-full p-1.5 hover:bg-secondary flex items-center justify-center" aria-label="Version info">
                <Info className="h-4 w-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{currentVersionInfo.label}</h4>
                  <p className="text-sm text-muted-foreground">{currentVersionInfo.description}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {currentVersionInfo.version}
                </Badge>
              </div>
              
              <div className="flex items-center pt-2">
                <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  Released on {currentVersionInfo.releaseDate}
                </span>
              </div>
              
              <ScrollArea className="h-[125px] mt-2">
                <div className="pt-2">
                  <h5 className="text-xs font-medium">Features:</h5>
                  <ul className="text-xs mt-2 space-y-1.5 list-disc list-outside ml-4">
                    {currentVersionInfo.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </ScrollArea>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </div>
  );
};

export default VersionSelector;
