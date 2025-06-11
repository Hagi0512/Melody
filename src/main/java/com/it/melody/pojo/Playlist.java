package com.it.melody.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Playlist {
    private int playlistId;
    private String name;
    private int userId;
    private LocalDateTime createdAt;
    private int songCount;
    private String userName;
    private String cover;

    private List<Songs> songs;
}
