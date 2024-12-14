// components/CollaborationsCard.js
import React from 'react';
import Image from "next/image";
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import avatar from "@/assets/images/avatar.webp";

export default function CollaborationsCard({ collaborations }) {
  return (
    <Card>
      <CardContent>
        <h2 className="mb-2 text-lg font-semibold">Collaborations</h2>
        <List>
          {collaborations.map((member, index) => (
            <div key={index}>
              <ListItem className="py-4">
                <ListItemAvatar>
                  <Image
                    className="w-8 h-8 rounded-full cursor-pointer"
                    src={avatar}
                    alt="Profile Picture"
                    width={32}
                    height={32}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={member.auth}
                  secondary={
                    <div className="space-y-1">
                      <div className="text-gray-500">
                        {member.coAuth}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.role}
                      </div>
                      <div className="text-xs text-gray-400">
                        {member.lastActivity}
                      </div>
                    </div>
                  }
                />
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </ListItem>
              {index < collaborations.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}